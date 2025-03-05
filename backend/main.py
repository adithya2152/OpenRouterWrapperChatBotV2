from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1")

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class ChatRequest(BaseModel):
    message: str  # User's message input

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Generates an AI response based on a predefined system prompt"""
    
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing API Key")

    # Static system prompt for AI behavior
    system_prompt = """
    You are an AI tutor guiding a student.
    Your goal is to ask open-ended, engaging questions to help them think critically.
    Start by asking an insightful question about their learning journey.
    """

    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistralai/mistral-7b-instruct",  # Free model on OpenRouter
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ]
        }

        response = requests.post(f"{BASE_URL}/chat/completions", json=payload, headers=headers)

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API Key")

        response_json = response.json()
        return {"reply": response_json["choices"][0]["message"]["content"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
