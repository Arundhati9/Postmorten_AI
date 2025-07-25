def get_mock_trends(platform: str, niche: str, frequency: str):
    return [
        {
            "id": "1",
            "title": f"{niche} - Viral Challenge",
            "platform": platform,
            "frequency": frequency,
            "niche": niche,
            "summary": "A new meme challenge is trending across TikTok.",
            "impact": "High",
            "action": "Create a remix with your twist."
        },
        {
            "id": "2",
            "title": f"{niche} - New Sound Clip",
            "platform": platform,
            "frequency": frequency,
            "niche": niche,
            "summary": "An audio clip from a TV show is going viral.",
            "impact": "Medium",
            "action": "Use this audio with a relevant sketch or reaction."
        }
    ]
