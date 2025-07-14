from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os
from dotenv import load_dotenv
from openai import OpenAI  # OpenRouter-compatible OpenAI import

load_dotenv()

# OpenRouter client setup
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  # Store this in your .env
)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    url = data.get("url")
    print(f"Received URL: {url}")

    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': True,
        'force_generic_extractor': True,
        'nocheckcertificate': True,
        'default_search': 'ytsearch',
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        title = info.get("title", "")
        description = info.get("description", "")

        prompt = f"""
        Video Title: {title}
        Description: {description}

        Analyze why this video may not be performing well on YouTube.
        Mention 3-5 possible reasons in simple, non-technical terms.
        """

        print("Prompt ready. Sending to OpenRouter...")

        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",  # Optional
                "X-Title": "PostMortem AI",                # Optional
            },
            model="deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages=[
                {"role": "system", "content": "You are a YouTube video performance expert."},
                {"role": "user", "content": prompt}
            ]
        )

        generated_text = completion.choices[0].message.content.strip()
        return { "report": generated_text }

    except Exception as e:
        print("Error occurred:", str(e))
        return { "report": f"Error: {str(e)}" }
