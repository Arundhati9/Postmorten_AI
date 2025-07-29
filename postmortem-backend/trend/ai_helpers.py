import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_video_ideas_from_keywords(keywords: list[str]) -> list[str]:
    prompt = (
        f"You are a viral YouTube strategist. Based on these keywords: {', '.join(keywords)}, "
        f"generate 3 engaging YouTube video ideas with catchy titles to help a small creator go viral."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=150
        )
        return response.choices[0].message.content.strip().split("\n")
    except Exception as e:
        print(f"[OpenAI Error] {e}")
        return []
