from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import openai
import os
from dotenv import load_dotenv

load_dotenv()


openai.api_key =  os.getenv("OPENAI_API_KEY")
app = FastAPI()

# Enable CORS (very important for frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    url = data.get("url")
    print(f"Received URL: {url}")

    # ✅ Add yt-dlp options here
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

        # Generate AI response
        completion = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a YouTube video performance expert."},
                {"role": "user", "content": prompt}
            ]
        )
        # generated_text = completion.choices[0].message.content.strip()
        # Replace OpenAI call with dummy response temporarily
        print("Prompt ready. Sending to OpenAI...")
        generated_text = "Test response: This is a mock postmortem report for development purposes."
        return { "report": generated_text }


        # return { "report": generated_text }

        # Replace OpenAI API call with this for now




    except Exception as e:
        print("Error occurred:", str(e))
        return { "report": f"Error: {str(e)}" }
