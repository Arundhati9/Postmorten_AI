import openai
import os
openai.api_key = os.getenv("OPENROUTER_API_KEY")

async def generate_video_idea(trend_title: str, niche: str):
    prompt = f"Generate a YouTube video title and short script for a trend titled '{trend_title}' in the '{niche}' niche."
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message["content"]
