import os
import re
import httpx
from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def get_youtube_client():
    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=YOUTUBE_API_KEY)

def extract_keywords_and_hashtags(text: str):
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

    return {"channelId": channel_id, "title": snippet["title"], "subscriberCount": subs, "niche": niche}

async def get_viral_youtube_trends(niche: str, min_subs: int, max_subs: int) -> list:
    yt = get_youtube_client()

    search_resp = yt.search().list(
        q=niche,
        part="id,snippet",
        type="video",
        order="viewCount",
        maxResults=20
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
        subs = 0  # We don't know subscriber count of these other channels here

        trends.append({
            "title": title,
            "videoId": vid["id"],
            "channel": channel_title,
            "views": views,
            "keywords": keywords,
            "hashtags": hashtags,
            "subscriberCount": subs
        })

    # Since we don't have subscriber count for other channels, skipping subs filter
    return trends




# import os
# from googleapiclient.discovery import build

# # Load your API key from environment variable or hardcode (not recommended)
# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") or "YOUR_YOUTUBE_API_KEY"

# YOUTUBE_API_SERVICE_NAME = "youtube"
# YOUTUBE_API_VERSION = "v3"

# def get_youtube_client():
#     return build(
#         YOUTUBE_API_SERVICE_NAME,
#         YOUTUBE_API_VERSION,
#         developerKey=YOUTUBE_API_KEY
#     )

# async def get_viral_youtube_trends(niche: str):
#     youtube = get_youtube_client()

#     # Perform search
#     search_response = youtube.search().list(
#         q=niche,
#         part="id,snippet",
#         maxResults=10,
#         type="video",
#         order="viewCount",
#         relevanceLanguage="en"
#     ).execute()

#     results = []

#     for item in search_response["items"]:
#         video_id = item["id"]["videoId"]
#         snippet = item["snippet"]
#         title = snippet["title"]
#         channel = snippet["channelTitle"]

#         # Get video stats (views, etc.)
#         stats_response = youtube.videos().list(
#             part="statistics,snippet",
#             id=video_id
#         ).execute()

#         stats = stats_response["items"][0]
#         view_count = stats["statistics"].get("viewCount", "0")

#         # Extract tags/keywords if available
#         tags = stats["snippet"].get("tags", [])
#         hashtags = [t for t in tags if t.startswith("#")]

#         trend_data = {
#             "title": title,
#             "videoId": video_id,
#             "channel": channel,
#             "views": view_count,
#             "keywords": tags[:5],         # limit to 5
#             "hashtags": hashtags[:5]      # limit to 5
#         }

#         results.append(trend_data)

#     return results
