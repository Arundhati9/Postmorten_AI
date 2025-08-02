from fastapi import APIRouter, Query
from db.supabase_client import supabase
from services.trend_generator import get_trends_for_niche
from services.personalization import score_trends_by_user

router = APIRouter()

@router.get("/trends/personalized")
def personalized_trends(user_id: str = Query(...)):
    user_data = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_data.data:
        return {"trends": []}
    
    user = user_data.data[0]
    niche = user.get("niche", "General")
    past_videos = user.get("history", [])  # Optional, if stored

    trends = get_trends_for_niche(niche)
    ranked = score_trends_by_user(trends, past_videos)

    return {"trends": ranked}
