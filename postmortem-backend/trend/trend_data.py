import os
from googleapiclient.discovery import build

# Load your API key from environment variable or hardcode (not recommended)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") or "YOUR_YOUTUBE_API_KEY"

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def get_youtube_client():
    return build(
        YOUTUBE_API_SERVICE_NAME,
        YOUTUBE_API_VERSION,
        developerKey=YOUTUBE_API_KEY
    )

async def get_viral_youtube_trends(niche: str):
    youtube = get_youtube_client()

    # Perform search
    search_response = youtube.search().list(
        q=niche,
        part="id,snippet",
        maxResults=10,
        type="video",
        order="viewCount",
        relevanceLanguage="en"
    ).execute()

    results = []

    for item in search_response["items"]:
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        title = snippet["title"]
        channel = snippet["channelTitle"]

        # Get video stats (views, etc.)
        stats_response = youtube.videos().list(
            part="statistics,snippet",
            id=video_id
        ).execute()

        stats = stats_response["items"][0]
        view_count = stats["statistics"].get("viewCount", "0")

        # Extract tags/keywords if available
        tags = stats["snippet"].get("tags", [])
        hashtags = [t for t in tags if t.startswith("#")]

        trend_data = {
            "title": title,
            "videoId": video_id,
            "channel": channel,
            "views": view_count,
            "keywords": tags[:5],         # limit to 5
            "hashtags": hashtags[:5]      # limit to 5
        }

        results.append(trend_data)

    return results
