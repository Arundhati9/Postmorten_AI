from fastapi import APIRouter, Query
from trend.trend_data import get_viral_youtube_trends

router = APIRouter(prefix="/api", tags=["Trends"])  # Make sure prefix is /api

@router.get("/trends")
async def youtube_trends_by_niche(
    platform: str = Query(...),
    niche: str = Query(...)
):
    if platform.lower() == "youtube":
        data = await get_viral_youtube_trends(niche)
        return {"platform": "youtube", "niche": niche, "trends": data}
    return {"trends": []}
