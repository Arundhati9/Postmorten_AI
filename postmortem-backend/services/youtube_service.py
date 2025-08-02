from yt_helper import get_channel_metadata  # You should already have this

def fetch_channel_niche(channel_name: str) -> str:
    metadata = get_channel_metadata(channel_name)
    desc = metadata.get("description", "").lower()
    if "tech" in desc:
        return "Technology"
    elif "fitness" in desc:
        return "Fitness"
    elif "travel" in desc:
        return "Travel"
    elif "gaming" in desc:
        return "Gaming"
    return "General"
