from pydantic import BaseModel, Field
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
    PROCURACAO = "procuracao"
    DECLARACAO_HIPOSSUFICIENCIA = "declaracao_hipossuficiencia"


TIPO_LABELS = {
    TipoPeca.PETICAO_INICIAL: "Petição Inicial",
    TipoPeca.CONTESTACAO: "Contestação",
    TipoPeca.RECURSO_APELACAO: "Recurso de Apelação",
    TipoPeca.AGRAVO_INSTRUMENTO: "Agravo de Instrumento",
    TipoPeca.PETICAO_SIMPLES: "Petição Simples",
    TipoPeca.PARECER: "Parecer Jurídico",
    TipoPeca.CONTRATO: "Contrato",
    TipoPeca.PROCURACAO: "Procuração",
    TipoPeca.DECLARACAO_HIPOSSUFICIENCIA: "Declaração de Hipossuficiência",
}


class PecaGenerateRequest(BaseModel):
    caso_id: str
    tipo: TipoPeca
    instrucoes: str = Field(..., min_length=10, max_length=5000)


class PecaBundleRequest(BaseModel):
    caso_id: str
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
    signature_status: str = "unsigned"
    signature_id: Optional[str] = None
    signature_url: Optional[str] = None
    workspace_id: str
    created_at: str


class PecaUpdateRequest(BaseModel):
    conteudo: Optional[str] = None
    caso_id: Optional[str] = None
    cliente_id: Optional[str] = None


class SignerInfo(BaseModel):
    name: str = Field(..., min_length=2, description="Nome do assinante")
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$", description="E-mail do assinante")


class PecaSignatureRequest(BaseModel):
    signers: list[SignerInfo]
