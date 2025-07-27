import os
import re
import time
import logging
import asyncio
from typing import Any, Dict, Optional, List

import yt_dlp
import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from openai import OpenAI
from starlette.concurrency import run_in_threadpool

from yt_helper import get_video_stats, get_channel_stats

from trend.router import router as trend_router





load_dotenv()
logging.basicConfig(level=logging.INFO)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(trend_router)
CACHE: Dict[str, Dict[str, Any]] = {}
TASKS: Dict[str, Dict[str, Any]] = {}
CACHE_EXPIRY = 3600
sse_updates: Dict[str, asyncio.Queue] = {}

def get_cache_key(url: str, language: str) -> str:
    return f"{url}:{language}"

async def fetch_subtitle_text(sub_url: str) -> str:
    if not sub_url:
        return ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(sub_url)
            response.raise_for_status()
            lines = response.text.splitlines()
            return " ".join([
                line.strip() for line in lines
                if line.strip() and not line.startswith("WEBVTT") and "-->" not in line
            ])
    except Exception:
        logging.exception("Failed to fetch subtitles")
        return ""

def estimate_seo_score(title: str, tags: list, description: str, duration: int) -> int:
    score = 0
    if 30 <= len(title) <= 70:
        score += 25
    if len(description) >= 100:
        score += 25
    if len(tags) >= 5:
        score += 25
    if 60 <= duration <= 900:
        score += 25
    return min(score, 100)

async def analyze_video_llm(task_id: str, prompt: str, summary: dict) -> None:
    try:
        def sync_openai_call():
            completion = client.chat.completions.create(
                model="tngtech/deepseek-r1t2-chimera:free",
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "PostMortem AI",
                },
                messages=[
                    {"role": "system", "content": "You are a helpful AI YouTube strategist."},
                    {"role": "user", "content": prompt}
                ]
            )
            return completion

        if task_id in sse_updates:
            sse_updates[task_id].put_nowait("data: Generating report...\n\n")

        completion = await run_in_threadpool(sync_openai_call)
        generated_text = completion.choices[0].message.content.strip()

        TASKS[task_id] = {
            "report": generated_text,
            "summary": summary,
            "title": summary.get("title", ""),
            "status": "done"
        }

        if task_id in sse_updates:
            sse_updates[task_id].put_nowait("data: Report generated.\n\n")
            sse_updates[task_id].put_nowait(f"data: FINAL_REPORT: {generated_text}\n\n")
            sse_updates[task_id].put_nowait("data: [DONE]\n\n")

    except Exception as e:
        logging.error(f"Task {task_id} failed", exc_info=True)
        TASKS[task_id] = {"error": str(e), "status": "error"}
        if task_id in sse_updates:
            sse_updates[task_id].put_nowait(f"data: Error: {str(e)}\n\n")
            sse_updates[task_id].put_nowait("data: [DONE]\n\n")

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        url: Optional[str] = data.get("url")
        language: str = data.get("language", "en")

        if not url:
            return JSONResponse(status_code=400, content={"detail": "You must provide a URL."})

        cache_key = get_cache_key(url, language)
        now = time.time()
        if cache_key in CACHE and now - CACHE[cache_key]["timestamp"] < CACHE_EXPIRY:
            return JSONResponse(content=CACHE[cache_key]["result"])

        match = re.search(r"(?:v=|/)([0-9A-Za-z_-]{11})", url)
        video_id = match.group(1) if match else None
        if not video_id:
            return JSONResponse(status_code=400, content={"detail": "Invalid YouTube URL"})

        try:
            video_stats = await get_video_stats(video_id)
            channel_id = video_stats.get("channel_id")
            channel_stats = await get_channel_stats(channel_id)
        except Exception:
            logging.exception("Failed to fetch video or channel stats")
            return JSONResponse(status_code=500, content={"detail": "Failed to fetch video/channel stats"})

        title = video_stats.get("title", "")
        description = video_stats.get("description", "")
        tags = video_stats.get("tags", [])
        duration = video_stats.get("duration", 0)
        upload_date = video_stats.get("upload_date", "Unknown")
        category = video_stats.get("category", "Unknown")
        channel = video_stats.get("channel_title", "Unknown")
        thumbnail = video_stats.get("thumbnail", "")
        channel_url = f"https://www.youtube.com/channel/{channel_id or ''}"
        view_count = video_stats.get("views", 0)
        like_count = video_stats.get("likes", 0)
        comment_count = video_stats.get("comments", 0)
        subscriber_count = channel_stats.get("subscriber_count", 0)
        impressions = video_stats.get("impressions", view_count * 3)

        ctr = round((view_count / impressions) * 100, 2) if impressions > 0 else 0
        avg_view_duration = round(duration * 0.4, 2) if duration > 0 else 0
        seo_score = estimate_seo_score(title, tags, description, duration)
        interaction_rate = round(((like_count + comment_count) / view_count) * 100, 2) if view_count > 0 else 0
        retention_rate = round((avg_view_duration / duration) * 100, 2) if duration > 0 else 0

        ydl_opts_subs = {
            "quiet": True,
            "skip_download": True,
            "nocheckcertificate": True,
            "noplaylist": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitlesformat": "vtt",
            "subtitleslangs": [language],
        }

        subtitles_url = ""
        with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
            info = ydl.extract_info(url, download=False)

        if "subtitles" in info and language in info["subtitles"]:
            subtitles_url = info["subtitles"][language][0].get("url", "")
        elif "automatic_captions" in info and language in info["automatic_captions"]:
            subtitles_url = info["automatic_captions"][language][0].get("url", "")

        transcript_excerpt = (await fetch_subtitle_text(subtitles_url)).strip()[:1000] or "No subtitles available."
        lang_name = {"en": "English", "hi": "Hindi", "bn": "Bengali"}.get(language, "English")

        prompt = f"""
You are a no-BS YouTube strategist and growth consultant. A creator has uploaded a video for review. It might be a hit. It might be a flop.
...
Make your response in {lang_name}. Include 3 performance issues, 3 quick fixes, and one long-term strategy. Don't bold anything.   
"""

        summary = {
            "title": title,
            "channel": channel,
            "channel_url": channel_url,
            "category": category,
            "thumbnail": thumbnail,
            "views": view_count,
            "likes": like_count,
            "comments": comment_count,
            "duration": duration,
            "upload_date": upload_date,
            "subscriber_count": subscriber_count,
            "ctr": ctr,
            "seo_score": seo_score,
            "avg_view_duration": avg_view_duration,
            "interaction_rate": interaction_rate,
            "retention_rate": retention_rate,
            "transcript_excerpt": transcript_excerpt,
        }

        task_id = f"task-{int(time.time() * 1000)}"
        TASKS[task_id] = {"status": "processing"}
        sse_updates[task_id] = asyncio.Queue()

        asyncio.create_task(analyze_video_llm(task_id, prompt, summary))

        CACHE[cache_key] = {"result": {"task_id": task_id, "status": "processing"}, "timestamp": now}
        return {"task_id": task_id, "status": "processing"}

    except Exception as e:
        logging.error("Analyze error", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": f"Server error: {str(e)}"})

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    result = TASKS.get(task_id)
    if not result:
        return {
            "status": "not_found",
            "report": None,
            "summary": None,
            "video_title": None
        }

    return {
        "status": result.get("status"),
        "report": result.get("report"),
        "summary": result.get("summary"),
        "video_title": result.get("title")
    }

@app.get("/events/{task_id}")
async def events(task_id: str):
    async def event_stream():
        queue = sse_updates.get(task_id)
        if not queue:
            yield "data: No such task.\n\n"
            return
        while True:
            message = await queue.get()
            yield message
            if message.strip().endswith("[DONE]"):
                break
        sse_updates.pop(task_id, None)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# app.include_router(trend_router, prefix="/api")
app.include_router(trend_router)