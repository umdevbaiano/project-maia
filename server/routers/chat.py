"""
Maia Platform — Chat Router
Thin HTTP layer for chat endpoints (RNF-10: no business logic in router).
Supports demo mode for unauthenticated testing.
Supports both general chat and per-case contextual chat.
"""
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from config import get_settings
from database import get_database
from core.ai.factory import get_ai_provider
from models.chat import QuickChatRequest, QuickChatResponse, ChatHistoryResponse
from services import chat_service
from services.saas_service import check_and_increment_ai_quota
from middleware import get_current_user_or_demo

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    caso_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_or_demo),
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
    current_user: dict = Depends(get_current_user_or_demo),
):
    """
    Handle chat messages (general or case-scoped).
    If caso_id is provided, the conversation is contextual to that case.
    """
    try:
        db = get_database()
        workspace_id = current_user["_workspace_id"]
        
        settings = get_settings()
        if not settings.DEMO_MODE:
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
    current_user: dict = Depends(get_current_user_or_demo),
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

    settings = get_settings()
    if not settings.DEMO_MODE:
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
    current_user: dict = Depends(get_current_user_or_demo),
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


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    instruction: str = Form("Analise este documento e identifique pontos de melhoria."),
    current_user: dict = Depends(get_current_user_or_demo),
):
    """
    Analyze an uploaded document with a specific instruction.
    The file is extracted and chunked on-the-fly, then passed as RAG context
    together with the user's instruction to generate a contextual analysis.
    Streams the AI response via SSE.
    """
    ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
    MAX_FILE_SIZE = 10 * 1024 * 1024

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Formato .{ext} não suportado. Use: {ALLOWED_EXTENSIONS}")

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo inválido ou muito grande (máx 10MB).")

    db = get_database()
    ai_provider = get_ai_provider()
    workspace_id = current_user["_workspace_id"]
    user_id = current_user["_user_id"]

    async def event_generator():
        try:
            full_reply = ""
            async for chunk in chat_service.analyze_document_stream(
                db, file_bytes, ext, file.filename or "documento",
                instruction, ai_provider, workspace_id, user_id,
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
