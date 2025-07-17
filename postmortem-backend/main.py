# (Unchanged imports and setup)
import os
import re
import time
import logging
import asyncio
from typing import Any, Dict, Optional, List

import yt_dlp
import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from starlette.concurrency import run_in_threadpool

import numpy as np
import torch

from yt_helper import get_video_stats, get_channel_stats
from googleapiclient.discovery import build

load_dotenv()
logging.basicConfig(level=logging.INFO)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

tokenizer = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
sentiment_labels = ['negative', 'neutral', 'positive']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE = {}
TASKS = {}
CACHE_EXPIRY = 3600

def clean_text(text: str) -> str:
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#\w+", "", text)
    return text.strip()

def analyze_sentiment(comment: str) -> str:
    comment = clean_text(comment)
    if not comment:
        return "neutral"
    inputs = tokenizer(comment, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    scores = outputs.logits[0].numpy()
    probs = np.exp(scores) / np.sum(np.exp(scores))
    label = sentiment_labels[np.argmax(probs)]
    return label

def compute_sentiment_percentages(comments: List[str]) -> Dict[str, float]:
    pos, neg = 0, 0
    for c in comments:
        label = analyze_sentiment(c[:512])
        if label == 'positive':
            pos += 1
        elif label == 'negative':
            neg += 1
    total = pos + neg
    if total == 0:
        return {"positive_percent": 0.0, "negative_percent": 0.0}
    return {
        "positive_percent": round((pos / total) * 100, 2),
        "negative_percent": round((neg / total) * 100, 2)
    }

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

def get_all_comments(video_id, max_total=1000):
    try:
        api_key = os.getenv("YOUTUBE_API_KEY")
        youtube = build("youtube", "v3", developerKey=api_key)
        comments = []
        next_page_token = None

        while len(comments) < max_total:
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=100,
                pageToken=next_page_token,
                textFormat="plainText"
            )
            response = request.execute()
            items = response.get("items", [])

            for item in items:
                text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
                comments.append(text)

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        return comments[:max_total]
    except Exception:
        logging.exception("Failed to fetch YouTube comments.")
        return []

async def analyze_video_llm(task_id: str, prompt: str, summary: dict, sentiment_summary):
    try:
        def sync_openai_call():
            completion = client.chat.completions.create(
                model="deepseek/deepseek-r1-0528:free",
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

        completion = await run_in_threadpool(sync_openai_call)
        generated_text = completion.choices[0].message.content.strip()
        TASKS[task_id] = {
            "report": generated_text,
            "summary": summary,
            "sentiment_summary": sentiment_summary,
            "title": summary["title"],  # ✅ Added this line
            "status": "done"
        }
    except Exception as e:
        logging.error(f"Task {task_id} failed", exc_info=True)
        TASKS[task_id] = {"error": str(e), "status": "error"}

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        url = data.get("url")
        language = data.get("language", "en")

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
            return JSONResponse(status_code=500, content={"detail": "Failed to fetch video/channel stats"})

        title = video_stats.get("title")
        description = video_stats.get("description")
        tags = video_stats.get("tags", [])
        duration = video_stats.get("duration", 0)
        upload_date = video_stats.get("upload_date", "Unknown")
        category = video_stats.get("category", "Unknown")
        channel = video_stats.get("channel_title", "Unknown")
        thumbnail = video_stats.get("thumbnail", "")
        channel_url = f"https://www.youtube.com/channel/{channel_id}"
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
        with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
            info = ydl.extract_info(url, download=False)

        subtitles_url = ""
        if "subtitles" in info and language in info["subtitles"]:
            subtitles_url = info["subtitles"][language][0].get("url")
        elif "automatic_captions" in info and language in info["automatic_captions"]:
            subtitles_url = info["automatic_captions"][language][0].get("url")

        transcript_excerpt = (await fetch_subtitle_text(subtitles_url)).strip()[:1000] or "No subtitles available."
        lang_name = {"en": "English", "hi": "Hindi", "bn": "Bengali"}.get(language, "English")

        comments = await run_in_threadpool(get_all_comments, video_id, 1000)
        sentiment_summary = compute_sentiment_percentages(comments) if comments else {"positive_percent": 0, "negative_percent": 0}

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
- CTR: {ctr}%
- Avg. View Duration: {avg_view_duration}s
- SEO Score: {seo_score}/100
- Engagement Rate: {interaction_rate}%
- Retention Rate: {retention_rate}%

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
            "duration": duration,
            "upload_date": upload_date,
            "subscriber_count": subscriber_count,
            "ctr": ctr,
            "seo_score": seo_score,
            "avg_view_duration": avg_view_duration,
            "interaction_rate": interaction_rate,
            "retention_rate": retention_rate,
            "transcript_excerpt": transcript_excerpt,
            "sentiment_summary": sentiment_summary
        }

        task_id = f"task-{int(time.time() * 1000)}"
        TASKS[task_id] = {"status": "processing"}
        asyncio.create_task(analyze_video_llm(task_id, prompt, summary, sentiment_summary))

        CACHE[cache_key] = {"result": {"task_id": task_id, "status": "processing"}, "timestamp": now}
        return {"task_id": task_id, "status": "processing"}

    except Exception as e:
        logging.error("Analyze error", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": f"Server error: {str(e)}"})

@app.get("/result/{task_id}")
async def get_result(task_id: str):
    result = TASKS.get(task_id)
    if not result:
        return {"status": "not_found"}
    
    return {
        "status": result.get("status"),
        "report": result.get("report"),
        "summary": result.get("summary"),
        "sentiment_summary": result.get("sentiment_summary"),
        "video_title": result.get("title")  # ✅ Key line to send to frontend
    }


@app.post("/analyze-sentiment")
async def analyze_sentiment_route(comments: List[str] = Body(...)):
    try:
        sentiment_summary = compute_sentiment_percentages(comments)
        return sentiment_summary
    except Exception as e:
        logging.error("Sentiment analysis error", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": f"Sentiment error: {str(e)}"})
