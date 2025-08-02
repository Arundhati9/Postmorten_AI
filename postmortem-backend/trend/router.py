from fastapi import APIRouter, HTTPException, Query
from trend.trend_data import fetch_channel_and_trends
from trend.ai_helpers import generate_recommendations, assess_performance

router = APIRouter()

@router.get("/user-trends")
async def user_trends(channel_handle: str = Query(...)):
    info = fetch_channel_and_trends(channel_handle)
    if not info:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    performance = assess_performance(info["channel_stats"])
    recs = generate_recommendations(info["trends"], info["underperforming"], info["channel_stats"])
    
    return {
        "channel": info["channel_title"],
        "niche": info["niche"],
        "performance": performance,
        "recommendations": recs
    }
