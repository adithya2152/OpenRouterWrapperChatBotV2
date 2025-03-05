from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from docx import Document
import shutil

# Load API Key
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store global chat history (for a single session)
chat_history = [
    {"role": "system", "content": """
    You are an AI tutor guiding a student.
    Your goal is to:
    1. Answer the user's question clearly and concisely.
    2. Follow up with an engaging, open-ended question to encourage deeper thinking.
    3. Remember previous responses and relate your responses with that.
    """}
]

class ChatRequest(BaseModel):
    message: str  # User's input

def extract_text_from_file(file_path):
    """Extract text from a file (TXT, PDF, DOCX)"""
    if file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()
    elif file_path.endswith(".pdf"):
        reader = PdfReader(file_path)
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type. Use TXT, PDF, or DOCX.")

@app.post("/chat/")
async def chat_endpoint(request: ChatRequest):
    """Generates an AI response while maintaining chat history"""
    
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing API Key")

    # Append user message to chat history
    chat_history.append({"role": "user", "content": request.message})

    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": chat_history,  # Send entire chat history
            "max_tokens": 500,
            "temperature": 0.7,
        }

        response = requests.post(f"{BASE_URL}/chat/completions", json=payload, headers=headers)

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API Key")

        response_json = response.json()
        bot_response = response_json["choices"][0]["message"]["content"]

        # Append AI response to chat history
        chat_history.append({"role": "assistant", "content": bot_response})

        return {"reply": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), question: str = Form(...)):
    """Handles file uploads and generates AI responses based on file content + user question"""
    
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing API Key")

    # Save file temporarily
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extract text from uploaded file
        extracted_text = extract_text_from_file(temp_file_path)

        # Ensure the text isn't too long for OpenRouter
        truncated_text = extracted_text[:4000]  

        system_prompt = f"""
        You are an AI assistant analyzing a document.
        The user uploaded a file and has a question related to it.
        Your goal is to:
        1. Read and understand the document.
        2. Answer the user's question based on the document.
        3. Provide additional insights if relevant.

        Document Content:
        {truncated_text}
        """

        # Append file-related prompt to chat history
        chat_history.append({"role": "system", "content": system_prompt})
        chat_history.append({"role": "user", "content": question})

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": chat_history,  # Use full chat history
            "max_tokens": 500,
            "temperature": 0.7,
        }

        response = requests.post(f"{BASE_URL}/chat/completions", json=payload, headers=headers)

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API Key")

        response_json = response.json()
        bot_response = response_json["choices"][0]["message"]["content"]

        # Append AI response to chat history
        chat_history.append({"role": "assistant", "content": bot_response})

        return {"reply": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup: Remove temporary file
        os.remove(temp_file_path)
