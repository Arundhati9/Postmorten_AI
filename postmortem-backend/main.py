from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import httpx
import os
import time
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

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

CACHE = {}
CACHE_EXPIRY = 3600  # 1 hour

def get_cache_key(url, language):
    return f"{url}:{language}"

async def fetch_subtitle_text_async(sub_url):
    if not sub_url:
        return ""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(sub_url)
            if response.status_code != 200:
                return ""
            lines = response.text.splitlines()
            return " ".join([
                line.strip() for line in lines
                if line.strip() and not line.startswith("WEBVTT") and "-->" not in line
            ])
    except Exception as e:
        print("Subtitle fetch error:", str(e))
        return ""

def extract_basic_benchmarks(info):
    # Dummy benchmarks; in production, fetch from YouTube Data API
    return {
        "channel_avg_views": int(info.get("view_count", 0)) // 2 if info.get("view_count") else 0,
        "channel_avg_engagement": 5.0,
        "category": info.get("categories", ["Unknown"])[0] if info.get("categories") else "Unknown",
        "subscriber_count": int(info.get("channel_follower_count", 0)) if info.get("channel_follower_count") else 0
    }

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        url = data.get("url")
        language = data.get("language", "en")

        if not url:
            return {"report": "Error: No URL provided."}

        cache_key = get_cache_key(url, language)
        now = time.time()
        if cache_key in CACHE and (now - CACHE[cache_key]['timestamp'] < CACHE_EXPIRY):
            return CACHE[cache_key]['data']

        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'nocheckcertificate': True,
            'default_search': 'ytsearch',
            'noplaylist': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitlesformat': 'vtt',
            'subtitleslangs': [language],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        # Extract metadata
        title = info.get("title", "No title provided.")
        description = info.get("description", "No description provided.")
        tags = info.get("tags", [])
        view_count = int(info.get("view_count", 0))
        like_count = int(info.get("like_count", 0))
        comment_count = int(info.get("comment_count", 0))
        duration = int(info.get("duration", 0))
        upload_date = info.get("upload_date", "Unknown date")
        channel = info.get("uploader", "Unknown channel")
        thumbnail = info.get("thumbnail", "")
        category = info.get("categories", ["Unknown"])[0] if info.get("categories") else "Unknown"
        channel_id = info.get("channel_id", "")
        channel_url = f"https://www.youtube.com/channel/{channel_id}" if channel_id else ""
        subscriber_count = int(info.get("channel_follower_count", 0)) if info.get("channel_follower_count") else 0

        # Simple benchmarks (replace with real data if available)
        benchmarks = extract_basic_benchmarks(info)

        # Calculated metrics
        retention_rate = round(40.0, 2) if duration > 0 else 0  # Placeholder
        interaction_rate = round(((like_count + comment_count) / view_count) * 100, 2) if view_count > 0 else 0

        # Subtitle extraction (async)
        subtitles_url = ""
        if 'subtitles' in info and language in info['subtitles']:
            subtitles_url = info['subtitles'][language][0].get('url', '')
        elif 'automatic_captions' in info and language in info['automatic_captions']:
            subtitles_url = info['automatic_captions'][language][0].get('url', '')

        subtitle_text = await fetch_subtitle_text_async(subtitles_url)
        subtitle_excerpt = subtitle_text[:1000] if subtitle_text else "No subtitles available."

        lang_name = {"en": "English", "hi": "Hindi", "bn": "Bengali"}.get(language, "English")

        # AI Prompt
        prompt = f"""
You are a senior YouTube strategist and algorithm expert.

A creator's video is underperforming. Analyze it using metadata, metrics, transcript, and channel context. Provide an expert-level audit with actionable insights based on YouTube’s algorithm, CTR best practices, SEO standards, content retention techniques, and monetization policies.

### Video Metadata
- Title: {title}
- Description: {description}
- Tags: {', '.join(tags)}
- Category: {category}
- Thumbnail: {thumbnail}
- Views: {view_count}
- Likes: {like_count}
- Comments: {comment_count}
- Duration: {duration} seconds
- Upload Date: {upload_date}
- Channel: {channel}
- Channel Subscribers: {subscriber_count}
- Channel URL: {channel_url}

### Performance Metrics
- Estimated Retention Rate: {retention_rate}%
- User Interaction Rate: {interaction_rate}%
- Channel Avg Views: {benchmarks['channel_avg_views']}
- Channel Avg Engagement: {benchmarks['channel_avg_engagement']}%
- Category: {benchmarks['category']}

### Transcript Excerpt
{subtitle_excerpt}

### Guidelines:
1. List 3–5 reasons this video may be underperforming with reasoning.
2. Provide clear and strategic improvements for:
   - Click-Through Rate (CTR)
   - Retention (structure, hook, pacing)
   - Engagement (like/comment strategies)
   - SEO optimization
   - Policy or monetization risks
3. From the transcript, comment on:
   - Hook effectiveness in the first 15 seconds
   - Pacing, tone, clarity, and originality
4. Include a performance score (1–10) for:
   - CTR Appeal
   - Retention Strength
   - SEO Optimization
   - Policy/Monetization Safety
   - Topic Relevance
5. As a 25-year-old casual viewer, would you watch this to the end? Why?
6. End with:
   - Top 3 Quick Fixes
   - 1 Long-Term Strategy
   - A motivational message

Respond in {lang_name} with expert-level clarity and empathy.
"""

        if language in ["hi", "bn"]:
            prompt = (
                f"You must generate the full answer in {lang_name}. "
                f"Speak like a native creator mentor.\n\n{prompt}"
            )

        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "PostMortem AI",
            },
            model="deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages=[
                {"role": "system", "content": "You are a powerful and expert YouTube performance coach. Your answers are structured, kind, motivating, and data-driven."},
                {"role": "user", "content": prompt}
            ]
        )

        generated_text = completion.choices[0].message.content.strip()

        response = {
            "report": generated_text,
            "summary": {
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
            },
            "transcript_excerpt": subtitle_excerpt
        }

        CACHE[cache_key] = {"data": response, "timestamp": now}
        return response

    except Exception as e:
        print("Error:", str(e))
        return {"report": f"Error: {str(e)}"}
