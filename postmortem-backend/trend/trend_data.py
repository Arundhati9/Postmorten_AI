import os
import re
from googleapiclient.discovery import build
import openai
from typing import List, Tuple

# YouTube Setup
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

# OpenAI Setup
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_youtube_client():
    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=YOUTUBE_API_KEY)

def extract_keywords_and_hashtags(text: str) -> Tuple[List[str], List[str]]:
    words = re.findall(r'\b\w{4,}\b', text.lower())
    hashtags = re.findall(r"#\w+", text.lower())
    stop = {"your", "that", "with", "this", "about", "have"}
    keywords = [w for w in words if w not in stop]
    return keywords[:10], hashtags[:5]

def get_channel_info_by_name(channel_name: str):
    yt = get_youtube_client()
    search_resp = yt.search().list(
        part="snippet",
        q=channel_name,
        type="channel",
        maxResults=1
    ).execute()

    items = search_resp.get("items", [])
    if not items:
        return None

    channel_id = items[0]["snippet"]["channelId"]
    details = yt.channels().list(
        part="snippet,statistics,topicDetails",
        id=channel_id
    ).execute()

    ch = details["items"][0]
    stats = ch["statistics"]
    subs = int(stats.get("subscriberCount", 0))
    snippet = ch["snippet"]
    topic_cats = ch.get("topicDetails", {}).get("topicCategories", [])
    niche = topic_cats[0].split("/")[-1].lower() if topic_cats else "general"

    return {
        "channelId": channel_id,
        "title": snippet["title"],
        "subscriberCount": subs,
        "niche": niche
    }

async def generate_ideas_from_keywords(keywords: List[str]) -> List[str]:
    if not keywords:
        return []

    prompt = f"""You're a YouTube content strategist. Based on the following trending keywords: {', '.join(keywords)}, generate 2 viral YouTube content ideas suitable for a creator in this niche. Keep them short and creative."""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # You can change to gpt-4 if needed
            messages=[
                {"role": "system", "content": "You're a helpful AI trained in YouTube content growth."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )
        ideas_text = response.choices[0].message.content.strip()
        return [idea.strip("- ").strip() for idea in ideas_text.split("\n") if idea]
    except Exception as e:
        print(f"OpenAI error: {e}")
        return []

async def get_viral_youtube_trends(niche: str, min_subs: int, max_subs: int) -> list:
    yt = get_youtube_client()

    search_resp = yt.search().list(
        q=niche,
        part="id,snippet",
        type="video",
        order="viewCount",
        maxResults=10
    ).execute()

    video_ids = [item["id"]["videoId"] for item in search_resp.get("items", [])]
    if not video_ids:
        return []

    vid_resp = yt.videos().list(
        part="snippet,statistics",
        id=",".join(video_ids)
    ).execute()

    trends = []
    for vid in vid_resp.get("items", []):
        stats = vid["statistics"]
        views = stats.get("viewCount", "0")
        channel_title = vid["snippet"]["channelTitle"]
        title = vid["snippet"]["title"]
        desc = vid["snippet"].get("description", "")

        keywords, hashtags = extract_keywords_and_hashtags(f"{title} {desc}")
        video_ideas = await generate_ideas_from_keywords(keywords)

        trends.append({
            "title": title,
            "videoId": vid["id"],
            "channel": channel_title,
            "views": views,
            "keywords": keywords,
            "hashtags": hashtags,
            "subscriberCount": 0,
            "videoIdeas": video_ideas
        })

    return trends
