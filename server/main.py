"""
VettaLaw Backend API
FastAPI server with MongoDB integration and Google Gemini AI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import List, Optional
import google.generativeai as genai
import os
from bson import ObjectId

# Initialize FastAPI
app = FastAPI(title="VettaLaw API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongodb:27017")
DATABASE_NAME = "vettalaw"
COLLECTION_NAME = "chat_history"

# Google Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-3-flash-preview')
else:
    model = None

# Database client
mongo_client: Optional[AsyncIOMotorClient] = None
db = None
chat_collection = None


# Pydantic Models
class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: str  # "user" or "ai"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class QuickChatRequest(BaseModel):
    currentMessage: str
    history: Optional[List[ChatMessage]] = []


class QuickChatResponse(BaseModel):
    reply: str


# Startup and Shutdown Events
@app.on_event("startup")
async def startup_db_client():
    """Initialize MongoDB connection on startup"""
    global mongo_client, db, chat_collection
    mongo_client = AsyncIOMotorClient(MONGODB_URL)
    db = mongo_client[DATABASE_NAME]
    chat_collection = db[COLLECTION_NAME]
    print(f"✅ Connected to MongoDB at {MONGODB_URL}")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    if mongo_client:
        mongo_client.close()
        print("❌ Closed MongoDB connection")


# Helper Functions
def serialize_message(doc) -> dict:
    """Convert MongoDB document to JSON-serializable format"""
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


async def get_ai_response(message: str, history: List[ChatMessage]) -> str:
    """
    Generate AI response using Google Gemini
    """
    if not model:
        return "⚠️ AI not configured. Please set GEMINI_API_KEY environment variable."

    try:
        # Build context from history
        context = "Você é Maia, uma assistente jurídica especializada em direito brasileiro. "
        context += "Você ajuda advogados com pesquisa jurídica, redação de peças, análise de casos e prazos processuais. "
        context += "Seja precisa, objetiva e sempre cite artigos de lei quando relevante.\n\n"

        # Add conversation history
        if history:
            context += "Histórico da conversa:\n"
            for msg in history[-5:]:  # Last 5 messages for context
                role_label = "Advogado" if msg.role == "user" else "Maia"
                context += f"{role_label}: {msg.content}\n"

        context += f"\nAdvogado: {message}\nMaia:"

        # Generate response
        response = model.generate_content(context)
        return response.text

    except Exception as e:
        print(f"Error generating AI response: {e}")
        return f"Desculpe, ocorreu um erro ao processar sua solicitação: {str(e)}"


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "VettaLaw API",
        "status": "running",
        "version": "1.0.0",
        "ai_configured": model is not None
    }


@app.get("/chat/history")
async def get_chat_history():
    """
    Retrieve complete chat history from MongoDB
    """
    try:
        messages = []
        cursor = chat_collection.find().sort("timestamp", 1)

        async for doc in cursor:
            messages.append(serialize_message(doc))

        return {"messages": messages}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@app.post("/chat/quick", response_model=QuickChatResponse)
async def quick_chat(request: QuickChatRequest):
    """
    Handle quick chat messages
    1. Save user message to MongoDB
    2. Generate AI response using Gemini
    3. Save AI response to MongoDB
    4. Return AI response
    """
    try:
        # 1. Save user message
        user_message = {
            "role": "user",
            "content": request.currentMessage,
            "timestamp": datetime.utcnow()
        }

        user_result = await chat_collection.insert_one(user_message)
        print(f"💾 Saved user message: {user_result.inserted_id}")

        # 2. Get chat history for context
        history = []
        cursor = chat_collection.find().sort("timestamp", -1).limit(10)
        async for doc in cursor:
            history.append(ChatMessage(
                id=str(doc["_id"]),
                role=doc["role"],
                content=doc["content"],
                timestamp=doc["timestamp"]
            ))
        history.reverse()  # Oldest first

        # 3. Generate AI response
        ai_reply = await get_ai_response(request.currentMessage, history)

        # 4. Save AI response
        ai_message = {
            "role": "ai",
            "content": ai_reply,
            "timestamp": datetime.utcnow()
        }

        ai_result = await chat_collection.insert_one(ai_message)
        print(f"🤖 Saved AI response: {ai_result.inserted_id}")

        return QuickChatResponse(reply=ai_reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@app.delete("/chat/clear")
async def clear_chat_history():
    """
    Clear all chat history from the current session
    """
    try:
        result = await chat_collection.delete_many({})
        return {
            "status": "success",
            "deleted_count": result.deleted_count,
            "message": "Chat history cleared successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
