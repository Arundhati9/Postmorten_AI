import os
import httpx
from isodate import parse_duration
from dotenv import load_dotenv

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

async def get_channel_stats(channel_id: str):
    if not YOUTUBE_API_KEY or not channel_id:
        return {"subscriber_count": 0}
    
    url = f"{YOUTUBE_API_BASE}/channels"
    params = {
        "part": "statistics",
        "id": channel_id,
        "key": YOUTUBE_API_KEY
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            stats = data.get("items", [{}])[0].get("statistics", {})
            return {
                "subscriber_count": int(stats.get("subscriberCount", 0)),
            }
    except Exception as e:
        print(f"⚠️ Channel stats error: {e}")
        return {"subscriber_count": 0}


async def get_video_stats(video_id: str):
    if not YOUTUBE_API_KEY or not video_id:
        return {}
    
    url = f"{YOUTUBE_API_BASE}/videos"
    params = {
        "part": "snippet,statistics,contentDetails",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if not data.get("items"):
                return {}

            item = data["items"][0]
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            details = item.get("contentDetails", {})

            # Parse duration safely
            try:
                duration = int(parse_duration(details.get("duration", "PT0S")).total_seconds())
            except:
                duration = 0

            return {
                "channel_id": snippet.get("channelId", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "tags": snippet.get("tags", []),
                "upload_date": snippet.get("publishedAt", "")[:10],  # just YYYY-MM-DD
                "category": snippet.get("categoryId", "Unknown"),
                "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "duration": duration,
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0))
            }

    except Exception as e:
        print(f"⚠️ Video stats error: {e}")
        return {}
