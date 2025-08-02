from db.supabase_client import supabase

def match_trends_to_user_history(user_id: str, trends: list):
    user_videos = supabase.table("videos").select("*").eq("user_id", user_id).execute().data

    # Simple matching logic using keyword overlap (can be upgraded)
    personalized = []
    for trend in trends:
        for video in user_videos:
            if any(kw in video['title'].lower() for kw in trend['keywords']):
                trend["match_reason"] = f"Matches: {video['title']}"
                personalized.append(trend)
    return personalized
