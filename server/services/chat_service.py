"""
Maia Platform — Chat Service
Business logic for chat operations, decoupled from HTTP layer (RNF-10).
Supports both general workspace chat and per-case contextual chat.
Integrates hybrid RAG retrieval for document + legal-grounded responses (RF-40, RF-41).
"""
from datetime import datetime
import re
from typing import Optional, AsyncGenerator

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.ai.base import AIProvider
from core.rag import pipeline as rag
from core.security.encryption import encrypt_field, decrypt_field
from models.peca import TipoPeca
from services import peca_service


COLLECTION_NAME = "chat_history"


def _serialize_message(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable format."""
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if isinstance(doc.get("timestamp"), datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()
        # Decrypt content at read time
        if doc.get("content"):
            doc["content"] = decrypt_field(doc["content"])
        doc.pop("workspace_id", None)
        doc.pop("user_id", None)
    return doc


async def get_chat_history(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    caso_id: Optional[str] = None,
) -> list[dict]:
    query = {"workspace_id": workspace_id}
    if caso_id:
        query["caso_id"] = caso_id
    else:
        query["caso_id"] = {"$exists": False}

    collection = db[COLLECTION_NAME]
    messages = []
    cursor = collection.find(query).sort("timestamp", 1)
    async for doc in cursor:
        messages.append(_serialize_message(doc))
    return messages


async def _get_case_context(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str) -> str:
    """Build a context string from case data for case-scoped chat."""
    try:
        caso = await db["casos"].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
        if not caso:
            return ""

        context = f"""
📋 CONTEXTO DO PROCESSO (chat vinculado):
- Título: {caso.get('titulo', 'N/A')}
- Número: {caso.get('numero', 'N/A')}
- Tipo: {caso.get('tipo', 'N/A')}
- Status: {caso.get('status', 'N/A')}
- Descrição: {caso.get('descricao', 'N/A')}
"""
        # Join client info
        if caso.get("cliente_id"):
            cliente = await db["clientes"].find_one({"_id": ObjectId(caso["cliente_id"])})
            if cliente:
                context += f"- Cliente: {cliente.get('nome', 'N/A')}\n"
                context += f"- Documento: {cliente.get('documento', 'N/A')}\n"

        # Join deadlines
        prazos_cursor = db["prazos"].find({"caso_id": caso_id, "workspace_id": workspace_id}).sort("data_limite", 1).limit(5)
        prazos_list = []
        async for p in prazos_cursor:
            prazos_list.append(f"  • {p.get('titulo', 'N/A')} — {p.get('data_limite', 'N/A')} ({p.get('status', 'N/A')})")
        if prazos_list:
            context += "- Prazos vinculados:\n" + "\n".join(prazos_list) + "\n"

        context += "\nResponda SEMPRE considerando os dados deste processo. Se o advogado perguntar algo genérico, relacione ao caso quando possível.\n"
        return context

    except Exception as e:
        print(f"Error building case context: {e}")
        return ""


async def _prepare_chat_context(
    db: AsyncIOMotorDatabase,
    message: str,
    workspace_id: str,
    user_id: str,
    caso_id: Optional[str] = None,
):
    """
    Shared preparation logic for both sync and streaming chat:
    1. Save user message
    2. Load conversation history
    3. Build case context
    4. Retrieve RAG chunks
    Returns (collection, context, full_prompt, rag_chunks, legal_chunks)
    """
    collection = db[COLLECTION_NAME]

    # 1. Save user message (encrypted at rest)
    user_message = {
        "role": "user",
        "content": encrypt_field(message),
        "timestamp": datetime.utcnow(),
        "workspace_id": workspace_id,
        "user_id": user_id,
    }
    if caso_id:
        user_message["caso_id"] = caso_id
    await collection.insert_one(user_message)

    # 2. Load recent history
    history_query = {"workspace_id": workspace_id}
    if caso_id:
        history_query["caso_id"] = caso_id
    else:
        history_query["caso_id"] = {"$exists": False}

    context = []
    cursor = (
        collection.find(history_query)
        .sort("timestamp", -1)
        .limit(10)
    )
    async for doc in cursor:
        content = decrypt_field(doc["content"]) if doc.get("content") else ""
        context.append({"role": doc["role"], "content": content})
    context.reverse()

    # 3. Build case context
    case_context_str = ""
    if caso_id:
        case_context_str = await _get_case_context(db, caso_id, workspace_id)

    # 4. Hybrid RAG
    rag_chunks = []
    legal_chunks = []
    try:
        search_query = f"{case_context_str[:200]} {message}" if case_context_str else message
        result = await rag.retrieve_hybrid(workspace_id, search_query)
        rag_chunks = result.get("workspace", [])
        legal_chunks = result.get("legal", [])
    except Exception as e:
        print(f"RAG retrieval failed (non-blocking): {e}")

    full_prompt = f"{case_context_str}\n{message}" if case_context_str else message
    return collection, context, full_prompt, rag_chunks, legal_chunks


async def send_message(
    db: AsyncIOMotorDatabase,
    message: str,
    ai_provider: AIProvider,
    workspace_id: str,
    user_id: str,
    caso_id: Optional[str] = None,
) -> str:
    """
    Process a user message (non-streaming):
    1. Prepare context (save user msg, load history, RAG)
    2. Generate AI response
    3. Save AI response
    """
    collection, context, full_prompt, rag_chunks, legal_chunks = await _prepare_chat_context(
        db, message, workspace_id, user_id, caso_id
    )

    ai_reply = await ai_provider.generate(
        full_prompt, context, rag_context=rag_chunks, legal_context=legal_chunks
    )

    # Agentic Action: Check for MAIA_SAVE tag
    match = re.search(r'<!--\s*MAIA_SAVE:\s*(.*?)\s*-->', ai_reply)
    if match:
        tag_value = match.group(1).strip()
        try:
            tipo = TipoPeca(tag_value)
            
            # Buscar apenas o conteúdo entre as tags [INICIO_PECA] e [FIM_PECA]
            payload_match = re.search(r'\[INICIO_PECA\](.*?)\[FIM_PECA\]', ai_reply, re.DOTALL)
            clean_payload = payload_match.group(1).strip() if payload_match else re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', ai_reply).strip()
            
            titulo = f"{tipo.value.replace('_', ' ').title()}"
            await peca_service.save_peca_direct(
                db, workspace_id, user_id, tipo, titulo=titulo, conteudo=clean_payload, caso_id=caso_id
            )
            # Retira as tags pro usuário não vê-las
            ai_reply = ai_reply.replace('[INICIO_PECA]', '').replace('[FIM_PECA]', '')
            clean_reply = re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', ai_reply).strip()
            ai_reply = clean_reply + "\n\n✅ *Peça salva automaticamente no sistema em **Peças Jurídicas**.*"
        except ValueError:
            pass

    # Save AI response (encrypted at rest)
    ai_message = {
        "role": "ai",
        "content": encrypt_field(ai_reply),
        "timestamp": datetime.utcnow(),
        "workspace_id": workspace_id,
        "user_id": "maia",
    }
    if caso_id:
        ai_message["caso_id"] = caso_id
    await collection.insert_one(ai_message)

    return ai_reply


async def send_message_stream(
    db: AsyncIOMotorDatabase,
    message: str,
    ai_provider: AIProvider,
    workspace_id: str,
    user_id: str,
    caso_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Process a user message with streaming:
    1. Prepare context (save user msg, load history, RAG)
    2. Stream AI response token-by-token
    3. Save full AI response after streaming completes
    """
    collection, context, full_prompt, rag_chunks, legal_chunks = await _prepare_chat_context(
        db, message, workspace_id, user_id, caso_id
    )

    full_reply = ""
    async for chunk in ai_provider.generate_stream(
        full_prompt, context, rag_context=rag_chunks, legal_context=legal_chunks
    ):
        full_reply += chunk
        yield chunk

    # Agentic Action: Check for MAIA_SAVE tag after streaming is complete
    match = re.search(r'<!--\s*MAIA_SAVE:\s*(.*?)\s*-->', full_reply)
    if match:
        tag_value = match.group(1).strip()
        try:
            tipo = TipoPeca(tag_value)
            
            # Buscar apenas o conteúdo entre as tags [INICIO_PECA] e [FIM_PECA]
            payload_match = re.search(r'\[INICIO_PECA\](.*?)\[FIM_PECA\]', full_reply, re.DOTALL)
            clean_payload = payload_match.group(1).strip() if payload_match else re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', full_reply).strip()

            titulo = f"{tipo.value.replace('_', ' ').title()}"
            await peca_service.save_peca_direct(
                db, workspace_id, user_id, tipo, titulo=titulo, conteudo=clean_payload, caso_id=caso_id
            )
            
            # Avisa o frontend de sucesso
            success_msg = "\n\n✅ *Peça salva automaticamente no sistema em **Peças Jurídicas**.*"
            # Nos storages internos removemos as horrorosas tags visuais
            clean_reply_hist = full_reply.replace('[INICIO_PECA]', '').replace('[FIM_PECA]', '')
            clean_reply_hist = re.sub(r'<!--\s*MAIA_SAVE:\s*.*?\s*-->', '', clean_reply_hist).strip()
            full_reply = clean_reply_hist + success_msg
            yield success_msg
        except ValueError:
            pass

    # Save full AI response after streaming (encrypted at rest)
    ai_message = {
        "role": "ai",
        "content": encrypt_field(full_reply),
        "timestamp": datetime.utcnow(),
        "workspace_id": workspace_id,
        "user_id": "maia",
    }
    if caso_id:
        ai_message["caso_id"] = caso_id
    await collection.insert_one(ai_message)


async def clear_chat_history(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    caso_id: Optional[str] = None,
) -> int:
    query = {"workspace_id": workspace_id}
    if caso_id:
        query["caso_id"] = caso_id
    else:
        query["caso_id"] = {"$exists": False}
    result = await db[COLLECTION_NAME].delete_many(query)
    return result.deleted_count
