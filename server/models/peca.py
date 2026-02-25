"""
Maia Platform — Peça Jurídica Models
Types for AI-generated legal documents.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class TipoPeca(str, Enum):
    PETICAO_INICIAL = "peticao_inicial"
    CONTESTACAO = "contestacao"
    RECURSO_APELACAO = "recurso_apelacao"
    AGRAVO_INSTRUMENTO = "agravo_instrumento"
    PETICAO_SIMPLES = "peticao_simples"
    PARECER = "parecer"
    CONTRATO = "contrato"


TIPO_LABELS = {
    TipoPeca.PETICAO_INICIAL: "Petição Inicial",
    TipoPeca.CONTESTACAO: "Contestação",
    TipoPeca.RECURSO_APELACAO: "Recurso de Apelação",
    TipoPeca.AGRAVO_INSTRUMENTO: "Agravo de Instrumento",
    TipoPeca.PETICAO_SIMPLES: "Petição Simples",
    TipoPeca.PARECER: "Parecer Jurídico",
    TipoPeca.CONTRATO: "Contrato",
}


class PecaGenerateRequest(BaseModel):
    tipo: TipoPeca
    caso_id: Optional[str] = None
    instrucoes: str = Field(..., min_length=10, max_length=5000)


class PecaResponse(BaseModel):
    id: str
    tipo: TipoPeca
    tipo_label: str = ""
    titulo: str
    conteudo: str
    caso_id: Optional[str] = None
    caso_titulo: Optional[str] = None
    cliente_id: Optional[str] = None
    cliente_nome: Optional[str] = None
    workspace_id: str
    created_at: str


class PecaUpdateRequest(BaseModel):
    conteudo: Optional[str] = None
    caso_id: Optional[str] = None
    cliente_id: Optional[str] = None
