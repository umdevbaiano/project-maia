"""
Maia Platform — Chat Router
Thin HTTP layer for chat endpoints (RNF-10: no business logic in router).
Protected by JWT authentication, filtered by workspace (RNF-03).
Supports both general chat and per-case contextual chat.
"""
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse

from database import get_database
from core.ai.factory import get_ai_provider
from models.chat import QuickChatRequest, QuickChatResponse, ChatHistoryResponse
from services import chat_service
from services.saas_service import check_and_increment_ai_quota
from middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    caso_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve chat history. If caso_id is provided, returns case-scoped history."""
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        messages = await chat_service.get_chat_history(db, workspace_id, caso_id=caso_id)
        return ChatHistoryResponse(messages=messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@router.post("/quick", response_model=QuickChatResponse)
async def quick_chat(
    request: QuickChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Handle chat messages (general or case-scoped).
    If caso_id is provided, the conversation is contextual to that case.
    """
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        
        try:
            await check_and_increment_ai_quota(db, workspace_id)
        except ValueError as ve:
            raise HTTPException(status_code=402, detail=str(ve))

        ai_provider = get_ai_provider()
        user_id = current_user["_user_id"]
        reply = await chat_service.send_message(
            db, request.currentMessage, ai_provider, workspace_id, user_id,
            caso_id=request.caso_id,
        )
        return QuickChatResponse(reply=reply)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.post("/stream")
async def stream_chat(
    request: QuickChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Stream AI response via Server-Sent Events (SSE).
    Each event contains a JSON object with a 'chunk' field.
    The final event has 'done': true and the full 'reply'.
    """
    db = get_database()
    ai_provider = get_ai_provider()
    workspace_id = current_user["_workspace_id"]
    user_id = current_user["_user_id"]

    try:
        await check_and_increment_ai_quota(db, workspace_id)
    except ValueError as ve:
        raise HTTPException(status_code=402, detail=str(ve))

    async def event_generator():
        try:
            full_reply = ""
            async for chunk in chat_service.send_message_stream(
                db, request.currentMessage, ai_provider, workspace_id, user_id,
                caso_id=request.caso_id,
            ):
                full_reply += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            yield f"data: {json.dumps({'done': True, 'reply': full_reply})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/clear")
async def clear_chat_history(
    caso_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Clear chat history. If caso_id is provided, clears only that case's history."""
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        deleted_count = await chat_service.clear_chat_history(db, workspace_id, caso_id=caso_id)
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": "Chat history cleared successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")

