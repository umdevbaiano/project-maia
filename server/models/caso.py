"""
Maia Platform — Case (Processo) Models
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class CasoStatus(str, Enum):
    ATIVO = "ativo"
    EM_ANDAMENTO = "em_andamento"
    SUSPENSO = "suspenso"
    ARQUIVADO = "arquivado"
    ENCERRADO = "encerrado"


class CasoTipo(str, Enum):
    CIVEL = "civel"
    TRABALHISTA = "trabalhista"
    CRIMINAL = "criminal"
    TRIBUTARIO = "tributario"
    ADMINISTRATIVO = "administrativo"
    PREVIDENCIARIO = "previdenciario"
    OUTRO = "outro"


class CasoCreateRequest(BaseModel):
    numero: str = Field(..., min_length=1, max_length=30)
    titulo: str = Field(..., min_length=2, max_length=200)
    tipo: CasoTipo = CasoTipo.CIVEL
    status: CasoStatus = CasoStatus.EM_ANDAMENTO
    cliente_id: Optional[str] = None
    responsavel_id: Optional[str] = None
    tribunal: Optional[str] = None
    vara: Optional[str] = None
    descricao: Optional[str] = None


class CasoUpdateRequest(BaseModel):
    titulo: Optional[str] = None
    tipo: Optional[CasoTipo] = None
    status: Optional[CasoStatus] = None
    cliente_id: Optional[str] = None
    responsavel_id: Optional[str] = None
    tribunal: Optional[str] = None
    vara: Optional[str] = None
    descricao: Optional[str] = None


class CasoResponse(BaseModel):
    id: str
    numero: str
    titulo: str
    tipo: str
    status: str
    cliente_id: Optional[str] = None
    cliente_nome: Optional[str] = None
    responsavel_id: Optional[str] = None
    tribunal: Optional[str] = None
    vara: Optional[str] = None
    descricao: Optional[str] = None
    workspace_id: str
    created_at: str
    updated_at: str
