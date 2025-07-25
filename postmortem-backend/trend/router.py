from fastapi import APIRouter, Query
from typing import List
from .trend_data import get_mock_trends

router = APIRouter()

@router.get("/api/trends")
async def fetch_trends(
    platform: str = Query("YouTube"),
    niche: str = Query("Gaming"),
    frequency: str = Query("daily")
):
    """
    Returns trend cards based on platform, niche, and frequency.
    """
    trends = get_mock_trends(platform=platform, niche=niche, frequency=frequency)
    return {"trends": trends}
