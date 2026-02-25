"""
Maia Platform — Peça Jurídica Service
AI-powered legal document generation with RAG context.
"""
import re
from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.ai.base import AIProvider
from core.rag import pipeline as rag
from core.security.encryption import encrypt_field, decrypt_field
from models.peca import TipoPeca, TIPO_LABELS

COLLECTION = "pecas"

# Specialized prompts per document type
PECA_PROMPTS = {
    TipoPeca.PETICAO_INICIAL: """Gere uma PETIÇÃO INICIAL completa com a seguinte estrutura:
1. EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO (endereçamento)
2. QUALIFICAÇÃO DAS PARTES (autor e réu)
3. DOS FATOS (narrativa detalhada)
4. DO DIREITO (fundamentação legal com artigos de lei)
5. DOS PEDIDOS (listar todos os pedidos)
6. DO VALOR DA CAUSA
7. Requerimentos finais (citação, provas, etc.)
8. Local, data, advogado e OAB""",

    TipoPeca.CONTESTACAO: """Gere uma CONTESTAÇÃO completa com a seguinte estrutura:
1. EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO (endereçamento + nº do processo)
2. QUALIFICAÇÃO DO RÉU
3. DAS PRELIMINARES (se aplicável: inépcia, ilegitimidade, etc.)
4. DA IMPUGNAÇÃO AO VALOR DA CAUSA (se aplicável)
5. DO MÉRITO (refutar ponto a ponto com fundamentação legal)
6. DOS PEDIDOS (improcedência, honorários, etc.)
7. DAS PROVAS
8. Local, data, advogado e OAB""",

    TipoPeca.RECURSO_APELACAO: """Gere um RECURSO DE APELAÇÃO completo com a seguinte estrutura:
1. EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO (endereçamento)
2. RAZÕES DE APELAÇÃO (em peça apartada ao Tribunal)
3. EGRÉGIO TRIBUNAL / COLENDA CÂMARA
4. DA TEMPESTIVIDADE
5. DO BREVE RESUMO DA DEMANDA E DA SENTENÇA
6. DAS RAZÕES DO INCONFORMISMO (erro de julgamento, fundamentação legal)
7. DO PEDIDO DE REFORMA
8. Local, data, advogado e OAB""",

    TipoPeca.AGRAVO_INSTRUMENTO: """Gere um AGRAVO DE INSTRUMENTO completo com a seguinte estrutura:
1. EXCELENTÍSSIMO SENHOR DOUTOR DESEMBARGADOR RELATOR
2. DOS FATOS E DA DECISÃO AGRAVADA
3. DO CABIMENTO (Art. 1.015 do CPC)
4. DA NECESSIDADE DE EFEITO SUSPENSIVO / TUTELA RECURSAL
5. DAS RAZÕES DO AGRAVO (fundamentação legal detalhada)
6. DO PEDIDO
7. Local, data, advogado e OAB""",

    TipoPeca.PETICAO_SIMPLES: """Gere uma PETIÇÃO SIMPLES (intercorrente/intermediária) com a seguinte estrutura:
1. Endereçamento ao juízo com número do processo
2. Qualificação da parte
3. Exposição objetiva do requerimento
4. Fundamentação legal (se necessário)
5. Pedido claro
6. Local, data, advogado e OAB""",

    TipoPeca.PARECER: """Gere um PARECER JURÍDICO completo com a seguinte estrutura:
1. PARECER JURÍDICO Nº (título)
2. DA CONSULTA (pergunta ou situação apresentada)
3. DOS FATOS
4. DA ANÁLISE JURÍDICA (fundamentação doutrinária e legal detalhada)
5. DA JURISPRUDÊNCIA (decisões relevantes, se houver)
6. DA CONCLUSÃO (resposta objetiva à consulta)
7. Local, data, advogado e OAB""",

    TipoPeca.CONTRATO: """Gere um CONTRATO completo com a seguinte estrutura:
1. TÍTULO DO CONTRATO
2. QUALIFICAÇÃO DAS PARTES (contratante e contratada)
3. CLÁUSULA 1ª — DO OBJETO
4. CLÁUSULA 2ª — DO PREÇO E FORMA DE PAGAMENTO
5. CLÁUSULA 3ª — DO PRAZO
6. CLÁUSULA 4ª — DAS OBRIGAÇÕES DAS PARTES
7. CLÁUSULA 5ª — DA RESCISÃO
8. CLÁUSULA 6ª — DAS PENALIDADES
9. CLÁUSULA 7ª — DAS DISPOSIÇÕES GERAIS
10. CLÁUSULA 8ª — DO FORO
11. Local, data e assinaturas""",
}


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    # Decrypt sensitive fields
    if doc.get("conteudo"):
        doc["conteudo"] = decrypt_field(doc["conteudo"])
    if doc.get("instrucoes"):
        doc["instrucoes"] = decrypt_field(doc["instrucoes"])
    doc["tipo_label"] = TIPO_LABELS.get(doc.get("tipo", ""), "")
    return doc


async def generate_peca(
    db: AsyncIOMotorDatabase,
    ai_provider: AIProvider,
    workspace_id: str,
    user_id: str,
    tipo: TipoPeca,
    instrucoes: str,
    caso_id: Optional[str] = None,
) -> dict:
    """Generate a legal document using AI + RAG."""

    # 1. Build context from case data (if linked)
    caso_context = ""
    caso_titulo = None
    if caso_id:
        try:
            caso = await db["casos"].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
            if caso:
                caso_titulo = caso.get("titulo", "")
                caso_context = f"""
DADOS DO PROCESSO VINCULADO:
- Título: {caso.get('titulo', 'N/A')}
- Número: {caso.get('numero', 'N/A')}
- Tipo: {caso.get('tipo', 'N/A')}
- Status: {caso.get('status', 'N/A')}
- Descrição: {caso.get('descricao', 'N/A')}
"""
                # Try to get client data
                if caso.get("cliente_id"):
                    cliente = await db["clientes"].find_one({"_id": ObjectId(caso["cliente_id"])})
                    if cliente:
                        caso_context += f"""- Cliente: {cliente.get('nome', 'N/A')}
- Documento: {cliente.get('documento', 'N/A')}
- Email: {cliente.get('email', 'N/A')}
- Telefone: {cliente.get('telefone', 'N/A')}
"""
        except Exception as e:
            print(f"Error fetching case data: {e}")

    # 2. RAG retrieval (hybrid: legal + workspace docs)
    legal_chunks = []
    rag_chunks = []
    try:
        result = await rag.retrieve_hybrid(workspace_id, instrucoes)
        legal_chunks = result.get("legal", [])
        rag_chunks = result.get("workspace", [])
    except Exception as e:
        print(f"RAG retrieval failed: {e}")

    # 3. Build the generation prompt
    tipo_label = TIPO_LABELS[tipo]
    template = PECA_PROMPTS[tipo]

    prompt = f"""Você é um advogado brasileiro experiente. Gere uma peça jurídica do tipo: **{tipo_label}**.

{template}

{caso_context}

INSTRUÇÕES DO ADVOGADO:
{instrucoes}

REGRAS:
- Use linguagem jurídica formal e técnica
- Cite artigos de lei no formato "Art. X da Lei nº Y/AAAA"
- NUNCA invente números de artigos ou leis
- Use os artigos da legislação fornecidos como base
- A peça deve estar pronta para uso (completa, não um resumo)
- Formate em Markdown para boa apresentação
"""

    # 4. Generate with AI
    conteudo = await ai_provider.generate(
        prompt, context=None, rag_context=rag_chunks, legal_context=legal_chunks
    )

    # 4.1 Strip Agentic Action tags and conversational prefixes
    payload_match = re.search(r'\[INICIO_PECA\](.*?)\[FIM_PECA\]', conteudo, re.DOTALL)
    if payload_match:
        conteudo = payload_match.group(1).strip()
    
    conteudo = re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', conteudo).strip()
    conteudo = conteudo.replace('[INICIO_PECA]', '').replace('[FIM_PECA]', '').strip()

    # 5. Save to MongoDB (encrypt sensitive fields)
    titulo = f"{tipo_label} — {caso_titulo or instrucoes[:50]}"
    cliente_id = caso.get("cliente_id") if caso_id and caso else None
    cliente_nome = cliente.get('nome') if caso_id and caso and cliente else None
    
    return await save_peca_direct(
        db, workspace_id, user_id, tipo, titulo, conteudo, instrucoes, caso_id, caso_titulo, cliente_id, cliente_nome
    )


async def save_peca_direct(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    user_id: str,
    tipo: TipoPeca,
    titulo: str,
    conteudo: str,
    instrucoes: str = "Gerado via Chat",
    caso_id: Optional[str] = None,
    caso_titulo: Optional[str] = None,
    cliente_id: Optional[str] = None,
    cliente_nome: Optional[str] = None,
) -> dict:
    """Save a pre-generated document directly into the database."""
    doc = {
        "tipo": tipo.value,
        "titulo": titulo,
        "conteudo": encrypt_field(conteudo),
        "instrucoes": encrypt_field(instrucoes),
        "caso_id": caso_id,
        "caso_titulo": caso_titulo,
        "cliente_id": cliente_id,
        "cliente_nome": cliente_nome,
        "workspace_id": workspace_id,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_pecas(db: AsyncIOMotorDatabase, workspace_id: str) -> list[dict]:
    pecas = []
    async for doc in db[COLLECTION].find({"workspace_id": workspace_id}).sort("created_at", -1):
        pecas.append(_serialize(doc))
    return pecas


async def get_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str) -> Optional[dict]:
    doc = await db[COLLECTION].find_one({"_id": ObjectId(peca_id), "workspace_id": workspace_id})
    if not doc:
        return None
    return _serialize(doc)


async def delete_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"_id": ObjectId(peca_id), "workspace_id": workspace_id})
    return result.deleted_count > 0

async def update_peca(db: AsyncIOMotorDatabase, peca_id: str, workspace_id: str, update_data: dict) -> Optional[dict]:
    # Sanitize and resolve relations
    doc_updates = {}
    
    if "conteudo" in update_data and update_data["conteudo"] is not None:
        doc_updates["conteudo"] = encrypt_field(update_data["conteudo"])
        
    if "caso_id" in update_data:
        caso_id = update_data["caso_id"]
        if caso_id:
            caso = await db["casos"].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
            if caso:
                doc_updates["caso_id"] = caso_id
                doc_updates["caso_titulo"] = caso.get("titulo", "")
                if caso.get("cliente_id"):
                    doc_updates["cliente_id"] = caso["cliente_id"]
                    cliente = await db["clientes"].find_one({"_id": ObjectId(caso["cliente_id"])})
                    if cliente:
                        doc_updates["cliente_nome"] = cliente.get("nome", "")
        else:
            doc_updates["caso_id"] = None
            doc_updates["caso_titulo"] = None

    if "cliente_id" in update_data:
        cliente_id = update_data["cliente_id"]
        if cliente_id:
            cliente = await db["clientes"].find_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id})
            if cliente:
                doc_updates["cliente_id"] = cliente_id
                doc_updates["cliente_nome"] = cliente.get("nome", "")
        else:
            doc_updates["cliente_id"] = None
            doc_updates["cliente_nome"] = None

    if not doc_updates:
        return await get_peca(db, peca_id, workspace_id)

    updated = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(peca_id), "workspace_id": workspace_id},
        {"$set": doc_updates},
        return_document=True
    )
    if not updated:
        return None
    return _serialize(updated)
