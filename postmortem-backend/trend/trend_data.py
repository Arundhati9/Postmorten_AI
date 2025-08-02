import os, requests
from dotenv import load_dotenv

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetch_channel_and_trends(handle: str):
    # 1. Look up channel by handle
    ch_url = "https://youtube.googleapis.com/youtube/v3/channels"
    resp = requests.get(ch_url, params={
        "forUsername": handle,
        "part": "snippet,statistics",
        "key": YOUTUBE_API_KEY
    }).json()
    items = resp.get("items", [])
    if not items:
        return None
    ch = items[0]
    chan_id = ch["id"]
    channel_title = ch["snippet"]["title"]
    niche = ch["snippet"]["description"].split()[0]  # naive niche inference

    stats = ch["statistics"]
    channel_stats = {
        "subscribers": int(stats.get("subscriberCount", 0)),
        "totalViews": int(stats.get("viewCount", 0)),
        "videoCount": int(stats.get("videoCount", 0))
    }

    # 2. Fetch channel videos
    search_url = "https://www.googleapis.com/youtube/v3/search"
    sr = requests.get(search_url, params={
        "channelId": chan_id,
        "part": "snippet",
        "order": "date",
        "maxResults": 20,
        "key": YOUTUBE_API_KEY
    }).json()

    recent_ids = [item["id"]["videoId"] for item in sr.get("items", []) if item.get("id","").get("videoId")]
    undervideos = []
    if recent_ids:
        stats_url = "https://www.googleapis.com/youtube/v3/videos"
        vr = requests.get(stats_url, params={
            "id": ",".join(recent_ids),
            "part": "snippet,statistics",
            "key": YOUTUBE_API_KEY
        }).json()
        for item in vr.get("items", []):
            views = int(item["statistics"].get("viewCount", 0))
            likes = int(item["statistics"].get("likeCount", 0))
            ctr = (likes / max(1, views)) * 100
            undervideos.append({"videoId": item["id"], "title": item["snippet"]["title"], "views": views, "ctr": ctr})

    # 3. Fetch trending recommendations (reusing earlier get_trends_for_niche)
    from trend.trend_data import get_trends_for_niche
    trends = get_trends_for_niche("youtube", niche, "daily")

    return {"channel_title": channel_title, "niche": niche, "channel_stats": channel_stats, "underperforming": undervideos, "trends": trends}
