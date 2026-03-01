"""
Maia Platform — Client (Cliente) Models
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TipoPessoa(str, Enum):
    FISICA = "fisica"
    JURIDICA = "juridica"


class ClienteCreateRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    tipo_pessoa: TipoPessoa = TipoPessoa.FISICA
    documento: Optional[str] = None  # CPF or CNPJ
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None


class ClienteUpdateRequest(BaseModel):
    nome: Optional[str] = None
    tipo_pessoa: Optional[TipoPessoa] = None
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None


class ClienteResponse(BaseModel):
    id: str
    nome: str
    tipo_pessoa: str
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None
    workspace_id: str
    created_at: str
    updated_at: str
