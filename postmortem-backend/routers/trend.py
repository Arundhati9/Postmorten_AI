from fastapi import APIRouter, Query
from services.personalization import match_trends_to_user_history
from services.trend_generator import generate_video_idea

router = APIRouter()

# Dummy trend source for now
trends_db = [
    {"title": "Day in Life Vlog", "keywords": ["vlog", "routine", "morning"]},
    {"title": "AI Tools You Need", "keywords": ["ai", "tools", "productivity"]}
]

@router.get("/trends/personalized")
async def get_personalized_trends(user_id: str):
    personalized = match_trends_to_user_history(user_id, trends_db)
    return {"trends": personalized}

@router.get("/trends/idea")
async def generate(trend: str, niche: str):
    idea = await generate_video_idea(trend, niche)
    return {"idea": idea}
