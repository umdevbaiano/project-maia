"""
Maia Platform — Chat Router
Thin HTTP layer for chat endpoints (RNF-10: no business logic in router).
Protected by JWT authentication, filtered by workspace (RNF-03).
"""
from fastapi import APIRouter, HTTPException, Depends

from database import get_database
from core.ai.factory import get_ai_provider
from models.chat import QuickChatRequest, QuickChatResponse, ChatHistoryResponse
from services import chat_service
from middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Retrieve chat history for the current workspace."""
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        messages = await chat_service.get_chat_history(db, workspace_id)
        return ChatHistoryResponse(messages=messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@router.post("/quick", response_model=QuickChatResponse)
async def quick_chat(
    request: QuickChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Handle quick chat messages:
    1. Save user message to MongoDB (scoped to workspace)
    2. Generate AI response using configured provider
    3. Save AI response to MongoDB
    4. Return AI response
    """
    try:
        db = get_database()
        ai_provider = get_ai_provider()
        workspace_id = current_user["_workspace_id"]
        user_id = current_user["_user_id"]
        reply = await chat_service.send_message(
            db, request.currentMessage, ai_provider, workspace_id, user_id
        )
        return QuickChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.delete("/clear")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    """Clear chat history for the current workspace."""
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        deleted_count = await chat_service.clear_chat_history(db, workspace_id)
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": "Chat history cleared successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")
