from trend.trend_data import get_trends_for_niche
from utils.similarity import compute_matching_score  # use OpenAI embeddings or TF-IDF
import openai
import os
openai.api_key = os.getenv("OPENROUTER_API_KEY")

def assess_performance(stats):
    return {
        "subscriberCount": stats["subscribers"],
        "totalViews": stats["totalViews"],
        "videoCount": stats["videoCount"]
    }

def generate_recommendations(trends, underperformers, channel_stats):
    recs = []
    for trend in trends:
        score = compute_matching_score([uv["title"] for uv in underperformers], trend["title"])
        trend["matchScore"] = round(score * 100, 1)

        # AI prompt for idea + script
        prompt = f"User underperformed on videos: {[uv['title'] for uv in underperformers]}. New trend title: {trend['title']}. Suggest a script outline."
        ai = openai.ChatCompletion.create(model="gpt-3.5-turbo",
            messages=[{"role":"system","content":"You are a helpful YouTube strategist."},
                      {"role":"user","content":prompt}])
        idea = ai.choices[0].message.content

        recs.append({**trend, "suggestedScript": idea})
    return recs
