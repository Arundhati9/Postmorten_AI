import httpx
import os

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

async def fetch_channel_details(channel_name: str):
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": channel_name,
        "type": "channel",
        "key": YOUTUBE_API_KEY
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(search_url, params=params)
        data = response.json()
        return data['items'][0] if data['items'] else None
s