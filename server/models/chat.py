"""
Maia Platform — Chat Models
Pydantic models for chat endpoints.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ChatMessage(BaseModel):
    """Represents a single chat message (user or AI)."""
    id: Optional[str] = None
    role: str  # "user" or "ai"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class QuickChatRequest(BaseModel):
    """Request body for quick chat endpoint."""
    currentMessage: str
    history: Optional[list[ChatMessage]] = []
    caso_id: Optional[str] = None  # If set, chat is scoped to this case


class QuickChatResponse(BaseModel):
    """Response body for quick chat endpoint."""
    reply: str


class ChatHistoryResponse(BaseModel):
    """Response body for chat history endpoint."""
    messages: list[dict]
