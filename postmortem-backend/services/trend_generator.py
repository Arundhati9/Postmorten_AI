def get_trends_for_niche(niche: str):
    # Later replace with real YT API data
    mock_trends = {
        "Technology": [
            {"title": "AI Tools to Watch", "keywords": ["AI", "automation", "startups"]},
            {"title": "Coding Tips 2025", "keywords": ["code", "productivity", "VSCode"]}
        ],
        "Fitness": [
            {"title": "Shred Plan: 4 Weeks", "keywords": ["fat loss", "hiit", "nutrition"]},
            {"title": "Mobility Myths", "keywords": ["stretching", "mobility", "recovery"]}
        ],
        # Add more...
    }
    return mock_trends.get(niche, [])
