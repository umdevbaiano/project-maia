"""
Maia Platform — Deadline (Prazo) Models
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class PrazoStatus(str, Enum):
    PENDENTE = "pendente"
    CUMPRIDO = "cumprido"
    EXPIRADO = "expirado"


class PrazoPrioridade(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class PrazoCreateRequest(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=200)
    descricao: Optional[str] = None
    data_limite: str  # ISO date string YYYY-MM-DD
    caso_id: Optional[str] = None
    prioridade: PrazoPrioridade = PrazoPrioridade.MEDIA
    status: PrazoStatus = PrazoStatus.PENDENTE
    notified: bool = False


class PrazoUpdateRequest(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    data_limite: Optional[str] = None
    caso_id: Optional[str] = None
    prioridade: Optional[PrazoPrioridade] = None
    status: Optional[PrazoStatus] = None
    notified: Optional[bool] = None


class PrazoResponse(BaseModel):
    id: str
    titulo: str
    descricao: Optional[str] = None
    data_limite: str
    caso_id: Optional[str] = None
    caso_titulo: Optional[str] = None
    prioridade: str
    status: str
    workspace_id: str
    notified: bool = False
    created_at: str
    updated_at: str
