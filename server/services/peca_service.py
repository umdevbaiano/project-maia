"""
Maia Platform — Peça Jurídica Service
AI-powered legal document generation with RAG context.
"""
import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional, AsyncGenerator

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

from core.ai.base import AIProvider
from core.rag import pipeline as rag
from core.security.encryption import encrypt_field, decrypt_field
from core.signatures.factory import get_signature_provider
from core.documents.pdf_generator import markdown_to_pdf
import base64
from models.peca import TipoPeca, TIPO_LABELS

COLLECTION = "pecas"

# Specialized prompts per document type
PECA_PROMPTS = {
    TipoPeca.PETICAO_INICIAL: "Estrutura: Endereçamento, Qualificação, Fatos, Direito, Pedidos, Valor da Causa, Requerimentos.",
    TipoPeca.CONTESTACAO: "Estrutura: Endereçamento, Preliminares, Mérito (refutar pontos), Pedidos, Provas.",
    TipoPeca.RECURSO_APELACAO: "Estrutura: Endereçamento, Razões de Apelação, Resumo, Razões do Inconformismo, Pedido de Reforma.",
    TipoPeca.AGRAVO_INSTRUMENTO: "Estrutura: Endereçamento, Fatos, Cabimento, Efeito Suspensivo, Razões, Pedido.",
    TipoPeca.PETICAO_SIMPLES: "Estrutura: Endereçamento, Qualificação, Requerimento Objetivo, Pedido.",
    TipoPeca.PARECER: "Estrutura: Consulta, Fatos, Análise Jurídica, Jurisprudência, Conclusão.",
    TipoPeca.CONTRATO: "Estrutura: Objeto, Preço, Prazo, Obrigações, Rescisão, Penalidades, Foro.",
    TipoPeca.PROCURACAO: "Estrutura: Outorgante, Outorgado, Poderes (Ad Judicia), Finalidade.",
    TipoPeca.DECLARACAO_HIPOSSUFICIENCIA: "Estrutura: Qualificação, Declaração de Hipossuficiência (Art. 98 CPC).",
}


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime): doc["created_at"] = doc["created_at"].isoformat()
    for f in ("conteudo", "instrucoes"):
        if doc.get(f): doc[f] = decrypt_field(doc[f])
    doc["tipo_label"] = TIPO_LABELS.get(doc.get("tipo", ""), "")
    return doc


async def _build_peca_context_and_prompts(db: AsyncIOMotorDatabase, workspace_id: str, tipo: TipoPeca, instrucoes: str, caso_id: Optional[str] = None, streaming: bool = False):
    context, titulo, c_id, c_nome = "", None, None, None
    
    if caso_id:
        try:
            caso = await db["casos"].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
            if caso:
                titulo = caso.get("titulo", "")
                c_id = caso.get("cliente_id")
                context = f"DADOS DO PROCESSO: {caso.get('titulo')}\nNúmero: {caso.get('numero')}\nFatos: {caso.get('descricao')}\n"
                if c_id:
                    client = await db["clientes"].find_one({"_id": ObjectId(c_id)})
                    if client:
                        c_nome = client.get('nome')
                        context += f"Cliente: {c_nome}\nDocumento: {client.get('documento')}\n"
        except: pass

    legal, rag_ctx = [], []
    try:
        res = await rag.retrieve_hybrid(workspace_id, instrucoes)
        legal, rag_ctx = res.get("legal", []), res.get("workspace", [])
    except: pass

    prompt = f"""Advogado IA. Gere: {TIPO_LABELS[tipo]}.
{PECA_PROMPTS[tipo]}
{context}
INSTRUÇÕES: {instrucoes}
REGRAS: Linguagem formal, Cite leis reais, Formato Markdown.
NUNCA invente dados. Use [NOME], [CPF] se faltar.
"""
    return prompt, titulo, c_iasync def generate_peca(db: AsyncIOMotorDatabase, ai: AIProvider, workspace_id: str, user_id: str, tipo: TipoPeca, instrucoes: str, caso_id: Optional[str] = None) -> dict:
    prompt, titulo, c_id, c_nome, legal, rag_ctx = await _build_peca_context_and_prompts(db, workspace_id, tipo, instrucoes, caso_id)
    conteudo = await ai.generate(prompt, rag_context=rag_ctx, legal_context=legal)
    
    # Clean output
    conteudo = re.sub(r'\[/?INICIO_PECA\]|\[/?FIM_PECA\]', '', conteudo).strip()
    conteudo = re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', conteudo).strip()

    return await save_peca_direct(
        db, workspace_id, user_id, tipo, f"{TIPO_LABELS[tipo]} — {titulo or instrucoes[:50]}", 
        conteudo, instrucoes, caso_id, titulo, c_id, c_nome
    )


async def generate_peca_bundle(db: AsyncIOMotorDatabase, ai: AIProvider, workspace_id: str, user_id: str, caso_id: str, instrucoes: str) -> list[dict]:
    p = await generate_peca(db, ai, workspace_id, user_id, TipoPeca.PETICAO_INICIAL, instrucoes, caso_id)
    poa = await generate_peca(db, ai, workspace_id, user_id, TipoPeca.PROCURACAO, f"Base: {p['titulo']}", caso_id)
    dec = await generate_peca(db, ai, workspace_id, user_id, TipoPeca.DECLARACAO_HIPOSSUFICIENCIA, f"Base: {p['titulo']}", caso_id)
    return [p, poa, dec]


async def generate_peca_stream(db: AsyncIOMotorDatabase, ai: AIProvider, workspace_id: str, user_id: str, tipo: TipoPeca, instrucoes: str, caso_id: Optional[str] = None) -> AsyncGenerator[str, None]:
    prompt, titulo, c_id, c_nome, legal, rag_ctx = await _build_peca_context_and_prompts(db, workspace_id, tipo, instrucoes, caso_id, streaming=True)
    full_content = ""
    async for chunk in ai.generate_stream(prompt, rag_context=rag_ctx, legal_context=legal):
        full_content += chunk
        yield chunk

    full_content = re.sub(r'\[/?INICIO_PECA\]|\[/?FIM_PECA\]', '', full_content).strip()
    saved = await save_peca_direct(
        db, workspace_id, user_id, tipo, f"{TIPO_LABELS[tipo]} — {titulo or instrucoes[:50]}", 
        full_content, instrucoes, caso_id, titulo, c_id, c_nome
    )
    yield f"\n\n[MAIA_DONE_ID:{saved['id']}]"


async def save_peca_direct(db: AsyncIOMotorDatabase, workspace_id: str, user_id: str, tipo: TipoPeca, titulo: str, conteudo: str, instrucoes: str = "Chat", caso_id: Optional[str] = None, caso_titulo: Optional[str] = None, cliente_id: Optional[str] = None, cliente_nome: Optional[str] = None) -> dict:
    doc = {
        "tipo": tipo.value, "titulo": titulo, "conteudo": encrypt_field(conteudo),
        "instrucoes": encrypt_field(instrucoes), "caso_id": caso_id, "caso_titulo": caso_titulo,
        "cliente_id": cliente_id, "cliente_nome": cliente_nome, "workspace_id": workspace_id,
        "user_id": user_id, "created_at": datetime.now(timezone.utc)
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_pecas(db: AsyncIOMotorDatabase, workspace_id: str) -> list[dict]:
    return [_serialize(d) async for d in db[COLLECTION].find({"workspace_id": workspace_id}).sort("created_at", -1)]


async def get_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str) -> Optional[dict]:
    doc = await db[COLLECTION].find_one({"_id": ObjectId(peca_id), "workspace_id": workspace_id})
    return _serialize(doc) if doc else None


async def delete_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str) -> bool:
    return (await db[COLLECTION].delete_one({"_id": ObjectId(peca_id), "workspace_id": workspace_id})).deleted_count > 0


async def update_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str, update_data: dict) -> Optional[dict]:
    doc_updates = {}
    if "conteudo" in update_data and update_data["conteudo"]:
        doc_updates["conteudo"] = encrypt_field(update_data["conteudo"])
        
    for field in ["caso_id", "cliente_id"]:
        if field in update_data:
            val = update_data[field]
            if val:
                coll = "casos" if field == "caso_id" else "clientes"
                ref = await db[coll].find_one({"_id": ObjectId(val)})
                if ref:
                    doc_updates[field] = val
                    doc_updates[field.replace("_id", "_titulo") if field == "caso_id" else field.replace("_id", "_nome")] = ref.get("titulo" if field == "caso_id" else "nome")
            else:
                doc_updates[field] = None
                doc_updates[field.replace("_id", "_titulo") if field == "caso_id" else field.replace("_id", "_nome")] = None

    if not doc_updates: return await get_peca(db, peca_id, workspace_id)

    updated = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(peca_id), "workspace_id": workspace_id},
        {"$set": doc_updates}, return_document=True
    )
    return _serialize(updated) if updated else None


async def request_signature(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str, signers: list[dict]) -> Optional[dict]:
    peca = await db[COLLECTION].find_one({"_id": ObjectId(peca_id), "workspace_id": workspace_id})
    if not peca: return None
        
    ws = await db["workspaces"].find_one({"_id": ObjectId(workspace_id)})
    pdf_buffer = markdown_to_pdf(decrypt_field(peca.get("conteudo", "")), titulo=peca.get("titulo"), workspace_name=ws.get("workspace_name", "") if ws else "")
    
    envelope = await get_signature_provider().create_envelope(base64.b64encode(pdf_buffer.getvalue()).decode("utf-8"), peca.get("titulo"), signers)
    
    updated = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(peca_id)},
        {"$set": {
            "signature_status": envelope.get("status", "pending"),
            "signature_id": envelope.get("envelope_id"),
            "signature_url": envelope.get("signature_url")
        }}, return_document=True
    )
    return _serialize(updated)
cument=True
    )
    return _serialize(updated)
