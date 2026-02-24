"""
Maia Platform — Embeddings Module
Local embeddings using sentence-transformers (zero API cost).
Falls back to Google Embedding API if configured.
"""
from typing import Optional
import numpy as np

_model = None
_use_local = True


def _get_local_model():
    """Lazy-load sentence-transformers model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        print("✅ Local embedding model loaded: paraphrase-multilingual-MiniLM-L12-v2 (384 dims)")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts using local sentence-transformers.
    Returns list of 384-dim float vectors.
    """
    model = _get_local_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    model = _get_local_model()
    embedding = model.encode(query, normalize_embeddings=True, show_progress_bar=False)
    return embedding.tolist()


def get_chroma_embedding_function():
    """
    Return a ChromaDB-compatible embedding function using local model.
    This is used when creating/accessing ChromaDB collections.
    """
    from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

    class LocalEmbeddingFunction(EmbeddingFunction):
        def __call__(self, input: Documents) -> Embeddings:
            return embed_texts(input)

    return LocalEmbeddingFunction()
