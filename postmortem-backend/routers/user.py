from fastapi import APIRouter, HTTPException
from db.supabase_client import supabase
from services.youtube_service import fetch_channel_niche

router = APIRouter()

@router.post("/register")
def register_user(data: dict):
    email = data.get("email")
    channel_name = data.get("channel_name")
    if not email or not channel_name:
        raise HTTPException(status_code=400, detail="Missing fields")

    niche = fetch_channel_niche(channel_name)

    response = supabase.table("users").insert({
        "email": email,
        "channel_name": channel_name,
        "niche": niche
    }).execute()

    return {"id": response.data[0]['id'], "niche": niche}
