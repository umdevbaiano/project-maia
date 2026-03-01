"""
Maia Platform — Document Service
Business logic for document upload, indexing, and management.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.rag import pipeline as rag
from core.security.encryption import encrypt_field, decrypt_field

COLLECTION_NAME = "documents"


def _serialize_document(doc: dict) -> dict:
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        if doc.get("filename"):
            try:
                doc["filename"] = decrypt_field(doc["filename"])
            except Exception:
                pass
    return doc


async def process_document(
    db: AsyncIOMotorDatabase,
    file_bytes: bytes,
    filename: str,
    workspace_id: str,
    user_id: str,
    cliente_id: Optional[str] = None,
    caso_id: Optional[str] = None,
) -> dict:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown"

    doc_record = {
        "filename": encrypt_field(filename),
        "file_type": ext,
        "size_bytes": len(file_bytes),
        "chunk_count": 0,
        "workspace_id": workspace_id,
        "uploaded_by": user_id,
        "cliente_id": cliente_id,
        "caso_id": caso_id,
        "created_at": datetime.utcnow(),
    }
    result = await db[COLLECTION_NAME].insert_one(doc_record)
    doc_id = str(result.inserted_id)

    # Extract text and chunk
    text = rag.extract_text(file_bytes, ext)
    chunks = rag.chunk_text(text)

    # Index in ChromaDB
    chunk_count = await rag.index_document(workspace_id, doc_id, filename, chunks)

    await db[COLLECTION_NAME].update_one(
        {"_id": result.inserted_id},
        {"$set": {"chunk_count": chunk_count}},
    )

    return {
        "id": doc_id,
        "filename": filename,
        "chunk_count": chunk_count,
        "message": f"Documento '{filename}' indexado com {chunk_count} chunks.",
    }


async def list_documents(db: AsyncIOMotorDatabase, workspace_id: str) -> list[dict]:
    documents = []
    cursor = db[COLLECTION_NAME].find({"workspace_id": workspace_id}).sort("created_at", -1)
    async for doc in cursor:
        documents.append(_serialize_document(doc))
    return documents


async def delete_document(db: AsyncIOMotorDatabase, doc_id: str, workspace_id: str) -> dict:
    doc = await db[COLLECTION_NAME].find_one({"_id": ObjectId(doc_id), "workspace_id": workspace_id})
    if not doc:
        raise ValueError("Documento não encontrado.")
    await rag.delete_document(workspace_id, doc_id)
    await db[COLLECTION_NAME].delete_one({"_id": ObjectId(doc_id)})
    return {"message": f"Documento '{doc['filename']}' removido com sucesso."}


async def link_document(
    db: AsyncIOMotorDatabase,
    doc_id: str,
    workspace_id: str,
    cliente_id: Optional[str] = None,
    caso_id: Optional[str] = None,
) -> dict:
    doc = await db[COLLECTION_NAME].find_one({"_id": ObjectId(doc_id), "workspace_id": workspace_id})
    if not doc:
        raise ValueError("Documento não encontrado.")

    update_fields = {}
    if cliente_id is not None:
        update_fields["cliente_id"] = cliente_id if cliente_id != "" else None
    if caso_id is not None:
        update_fields["caso_id"] = caso_id if caso_id != "" else None

    if not update_fields:
        return {"message": "Nenhum vínculo a atualizar."}

    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": update_fields}
    )

    return {"message": "Documento vinculado com sucesso."}
