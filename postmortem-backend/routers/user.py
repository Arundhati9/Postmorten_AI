from fastapi import APIRouter
from services.youtube_service import fetch_channel_details
from db.supabase_client import supabase

router = APIRouter()

@router.post("/user/register")
async def register_user(email: str, channel_name: str):
    channel_info = await fetch_channel_details(channel_name)
    niche = channel_info['snippet']['title'].split()[0]  # simplistic niche detection

    new_user = supabase.table("users").insert({
        "email": email,
        "channel_name": channel_name,
        "niche": niche
    }).execute()
    return {"message": "User registered", "niche": niche}
