from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

# Load environment variables
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1")

# Initialize OpenAI Client for OpenRouter
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

app = FastAPI()

# CORS (Allow Frontend Requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing API Key")

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",  # Free model on OpenRouter
            messages=[
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": request.message},
            ],
            stream=False
        )

        return {"reply": response.choices[0].message.content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
