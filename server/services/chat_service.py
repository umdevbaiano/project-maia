"""
Maia Platform — Chat Service
Business logic for chat operations, decoupled from HTTP layer (RNF-10).
All operations are scoped to a workspace_id for multi-tenant isolation (RNF-03).
Integrates hybrid RAG retrieval for document + legal-grounded responses (RF-40, RF-41).
"""
from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.ai.base import AIProvider
from core.rag import pipeline as rag


COLLECTION_NAME = "chat_history"


def _serialize_message(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable format."""
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if isinstance(doc.get("timestamp"), datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()
        doc.pop("workspace_id", None)
        doc.pop("user_id", None)
    return doc


async def get_chat_history(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
) -> list[dict]:
    collection = db[COLLECTION_NAME]
    messages = []
    cursor = collection.find({"workspace_id": workspace_id}).sort("timestamp", 1)
    async for doc in cursor:
        messages.append(_serialize_message(doc))
    return messages


async def send_message(
    db: AsyncIOMotorDatabase,
    message: str,
    ai_provider: AIProvider,
    workspace_id: str,
    user_id: str,
) -> str:
    """
    Process a user message:
    1. Save user message to MongoDB
    2. Load recent history for context
    3. Hybrid RAG retrieval: legal base + workspace docs
    4. Generate AI response with both contexts
    5. Save AI response
    """
    collection = db[COLLECTION_NAME]

    # 1. Save user message
    user_message = {
        "role": "user",
        "content": message,
        "timestamp": datetime.utcnow(),
        "workspace_id": workspace_id,
        "user_id": user_id,
    }
    await collection.insert_one(user_message)

    # 2. Load recent history
    context = []
    cursor = (
        collection.find({"workspace_id": workspace_id})
        .sort("timestamp", -1)
        .limit(10)
    )
    async for doc in cursor:
        context.append({"role": doc["role"], "content": doc["content"]})
    context.reverse()

    # 3. Hybrid RAG retrieval (legal + workspace docs)
    rag_chunks = []
    legal_chunks = []
    try:
        result = await rag.retrieve_hybrid(workspace_id, message)
        rag_chunks = result.get("workspace", [])
        legal_chunks = result.get("legal", [])
    except Exception as e:
        print(f"RAG retrieval failed (non-blocking): {e}")

    # 4. Generate AI response with both contexts
    ai_reply = await ai_provider.generate(
        message, context, rag_context=rag_chunks, legal_context=legal_chunks
    )

    # 5. Save AI response
    ai_message = {
        "role": "ai",
        "content": ai_reply,
        "timestamp": datetime.utcnow(),
        "workspace_id": workspace_id,
        "user_id": "maia",
    }
    await collection.insert_one(ai_message)

    return ai_reply


async def clear_chat_history(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
) -> int:
    collection = db[COLLECTION_NAME]
    result = await collection.delete_many({"workspace_id": workspace_id})
    return result.deleted_count
