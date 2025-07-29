from fastapi import APIRouter, HTTPException, Query
from .trend_data import get_channel_info_by_name, get_viral_youtube_trends

router = APIRouter()

@router.get("/api/trends")
async def get_trends_by_channel(
    channel_name: str = Query(..., description="YouTube channel name")
):
    try:
        # 1. Get channel info from YouTube API
        channel_info = get_channel_info_by_name(channel_name)
        if not channel_info:
            raise HTTPException(status_code=404, detail="Channel not found")

        niche = channel_info.get("niche", "general")
        subscriber_count = int(channel_info.get("subscriberCount", 0))

        # 2. Dynamically calculate sub range
        min_subs = int(subscriber_count * 0.5)
        max_subs = int(subscriber_count * 5)

        # 3. Get trends
        trends = await get_viral_youtube_trends(niche=niche, min_subs=min_subs, max_subs=max_subs)

        return {
            "niche": niche,
            "subscriberCount": subscriber_count,
            "trends": trends
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
