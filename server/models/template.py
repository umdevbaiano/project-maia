from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

from models.peca import TipoPeca

class TemplateInDB(BaseModel):
    id: Optional[str] = None
    titulo: str = Field(..., min_length=3, description="Título do modelo (ex: 'Contestação de Banco')")
    descricao: str = Field(..., description="Breve explicação do propósito do template.")
    tipo_peca: TipoPeca = Field(..., description="Tipo do documento (peticao_inicial, etc)")
    instrucoes_base: str = Field(..., min_length=10, description="O prompt base preconfigurado")
    autor_nome: str = Field(..., description="Nome de exibição do autor")
    workspace_id: str = Field(..., description="ID da workspace de origem")
    is_public: bool = True
    downloads: int = 0
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TemplateResponse(BaseModel):
    id: str
    titulo: str
    descricao: str
    tipo_peca: TipoPeca
    tipo_label: str
    instrucoes_base: str
    autor_nome: str
    is_public: bool
    downloads: int
    created_at: str

class TemplateCreateRequest(BaseModel):
    titulo: str = Field(..., min_length=3)
    descricao: str = Field(..., min_length=5)
    tipo_peca: TipoPeca
    instrucoes_base: str = Field(..., min_length=10)
    autor_nome: str = Field(..., min_length=2)
