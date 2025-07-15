import os
import time
import re
import logging
import asyncio
import yt_dlp
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI

# YouTube API helper
from yt_helper import get_video_stats, get_channel_stats

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)

# LLM Client (OpenRouter)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# FastAPI App
app = FastAPI()

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caching
CACHE = {}
TASKS = {}
CACHE_EXPIRY = 3600

def get_cache_key(url, language):
    return f"{url}:{language}"

async def fetch_subtitle_text(sub_url):
    if not sub_url:
        return ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(sub_url)
            lines = response.text.splitlines()
            return " ".join([
                line.strip() for line in lines
                if line.strip() and not line.startswith("WEBVTT") and "-->" not in line
            ])
    except Exception:
        return ""

async def analyze_video_llm(task_id: str, prompt: str, summary: dict):
    try:
        logging.info(f"🧠 Sending task {task_id} to model...")
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
        generated_text = completion.choices[0].message.content.strip()
        TASKS[task_id] = {
            "report": generated_text,
            "summary": summary,
            "status": "done"
        }
        logging.info(f"✅ Task {task_id} completed.")
    except Exception as e:
        logging.error(f"❌ Task {task_id} failed", exc_info=True)
        TASKS[task_id] = {"error": str(e), "status": "error"}

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        url = data.get("url")
        language = data.get("language", "en")
        print("URL received!")
        if not url:
            return JSONResponse(status_code=400, content={"detail": "🎯 You must provide a URL."})

        cache_key = get_cache_key(url, language)
        now = time.time()
        if cache_key in CACHE and now - CACHE[cache_key]["timestamp"] < CACHE_EXPIRY:
            return JSONResponse(content=CACHE[cache_key]["result"])

        # Extract Video ID
        match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url)
        video_id = match.group(1) if match else None
        if not video_id:
            return JSONResponse(status_code=400, content={"detail": "Invalid YouTube URL"})

        use_fallback = False

        # Try YouTube Data API
        try:
            video_stats = await get_video_stats(video_id)
            channel_id = video_stats.get("channel_id", "")
            if not video_stats or not channel_id:
                raise Exception("Incomplete data from API")

            channel_stats = await get_channel_stats(channel_id)

            title = video_stats.get("title", "")
            description = video_stats.get("description", "")
            tags = video_stats.get("tags", [])
            duration = int(video_stats.get("duration", 0))
            upload_date = video_stats.get("upload_date", "Unknown")
            category = video_stats.get("category", "Unknown")
            channel = video_stats.get("channel_title", "Unknown")
            thumbnail = video_stats.get("thumbnail", "")
            channel_url = f"https://www.youtube.com/channel/{channel_id}"
            view_count = int(video_stats.get("views", 0))
            like_count = int(video_stats.get("likes", 0))
            comment_count = int(video_stats.get("comments", 0))
            subscriber_count = int(channel_stats.get("subscriber_count", 0))

        except Exception as e:
            logging.warning(f"⚠️ YouTube API failed. Falling back to yt_dlp. Reason: {e}")
            use_fallback = True

        # yt_dlp fallback
        if use_fallback:
            ydl_opts = {
                "quiet": True,
                "skip_download": True,
                "nocheckcertificate": True,
                "noplaylist": True,
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitlesformat": "vtt",
                "subtitleslangs": [language],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

            video_id = info.get("id", "")
            channel_id = info.get("channel_id", "")
            title = info.get("title", "")
            description = info.get("description", "")
            tags = info.get("tags", [])
            duration = int(info.get("duration") or 0)
            upload_date = info.get("upload_date", "Unknown")
            category = info.get("categories", ["Unknown"])[0]
            channel = info.get("uploader", "Unknown")
            thumbnail = info.get("thumbnail", "")
            channel_url = f"https://www.youtube.com/channel/{channel_id}" if channel_id else "Unavailable"
            view_count = int(info.get("view_count") or 0)
            like_count = int(info.get("like_count") or 0)
            comment_count = int(info.get("comment_count") or 0)
            subscriber_count = int(info.get("channel_follower_count") or 0)

        # Subtitle Extraction
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

        with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
            info = ydl.extract_info(url, download=False)

        subtitles_url = ""
        if "subtitles" in info and language in info["subtitles"]:
            subtitles_url = info["subtitles"][language][0].get("url")
        elif "automatic_captions" in info and language in info["automatic_captions"]:
            subtitles_url = info["automatic_captions"][language][0].get("url")

        transcript_excerpt = (await fetch_subtitle_text(subtitles_url)).strip()[:1000] or "No subtitles available."
        lang_name = {"en": "English", "hi": "Hindi", "bn": "Bengali"}.get(language, "English")

        # Performance calculations
        retention_rate = round(40.0, 2) if duration > 0 else 0
        interaction_rate = round(((like_count + comment_count) / view_count) * 100, 2) if view_count > 0 else 0

        # Prompt
        prompt = f"""
You're a senior YouTube strategist. Analyze the video using metadata, performance, transcript, and channel context.

# Video
- Title: {title}
- Description: {description}
- Tags: {', '.join(tags)}
- Category: {category}
- Duration: {duration}s
- Upload Date: {upload_date}

# Channel
- Name: {channel}
- Subscribers: {subscriber_count}
- Channel URL: {channel_url}

# Performance
- Views: {view_count}
- Likes: {like_count}
- Comments: {comment_count}
- Retention: {retention_rate}%
- Engagement: {interaction_rate}%

# Transcript (excerpt)
{transcript_excerpt}

Make your response in {lang_name}. Include 3 performance issues, 3 quick fixes, and one long-term strategy.
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
            "retention_rate": f"{retention_rate}%",
            "interaction_rate": f"{interaction_rate}%",
            "duration": duration,
            "subscriber_count": subscriber_count,
            "upload_date": upload_date,
            "transcript_excerpt": transcript_excerpt,
        }

        # CACHE[cache_key] = {"data": response, "timestamp": now}/
        CACHE[url]=response
        
        return response

    except Exception as e:
        logging.error("❌ Analyze error", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": f"Server error: {str(e)}"})

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    result = TASKS.get(task_id)
    if not result:
        return {"status": "not_found"}
    return result
