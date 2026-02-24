"""
Maia Platform — Document Models
Pydantic models for document management.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DocumentInDB(BaseModel):
    """Document metadata stored in MongoDB."""
    filename: str
    file_type: str
    size_bytes: int
    chunk_count: int = 0
    workspace_id: str
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentResponse(BaseModel):
    """Public document data."""
    id: str
    filename: str
    file_type: str
    size_bytes: int
    chunk_count: int
    uploaded_by: str
    created_at: str


class DocumentUploadResponse(BaseModel):
    """Response after successful upload + indexing."""
    id: str
    filename: str
    chunk_count: int
    message: str
