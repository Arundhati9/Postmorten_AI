def score_trends_by_user(trends, history):
    # Simulated scoring based on keyword match
    scored = []
    for trend in trends:
        trend_keywords = set(trend.get("keywords", []))
        history_keywords = set([kw for video in history for kw in video.get("keywords", [])])

        score = len(trend_keywords & history_keywords)
        trend["match_reason"] = f"Matched {score} keywords from your past content" if score else "New niche opportunity"
        trend["score"] = score
        scored.append(trend)
    
    return sorted(scored, key=lambda x: x["score"], reverse=True)
