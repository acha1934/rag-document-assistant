"""
ChromaDB vector store wrapper.
Uses sentence-transformers for local embeddings (no API key needed for embedding).
"""
from typing import List, Optional

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

from app.config import settings

# Singleton instances
_embeddings: Optional[HuggingFaceEmbeddings] = None
_vector_store: Optional[Chroma] = None

COLLECTION_NAME = "rag_documents"


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        # Runs entirely locally — downloads model on first use (~90 MB)
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def get_vector_store() -> Chroma:
    """Return (or create) the singleton Chroma vector store."""
    global _vector_store
    if _vector_store is None:
        _vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=_get_embeddings(),
            persist_directory=settings.chroma_persist_dir,
        )
    return _vector_store


def add_documents(chunks: List[Document]) -> None:
    """Embed and store document chunks in ChromaDB."""
    store = get_vector_store()
    store.add_documents(chunks)


def delete_document(doc_id: str) -> None:
    """Remove all chunks belonging to a doc_id from ChromaDB."""
    store = get_vector_store()
    store._collection.delete(where={"doc_id": doc_id})


def similarity_search(
    query: str,
    k: int = None,
    doc_ids: Optional[List[str]] = None,
) -> List[Document]:
    """
    Retrieve the top-k most relevant chunks for a query.
    Optionally filter to specific document IDs.
    """
    store = get_vector_store()
    k = k or settings.retrieval_k

    filter_dict = None
    if doc_ids:
        filter_dict = {"doc_id": {"$in": doc_ids}}

    return store.similarity_search(query, k=k, filter=filter_dict)


def list_documents() -> List[dict]:
    """Return metadata for all unique documents stored in ChromaDB."""
    store = get_vector_store()
    result = store._collection.get(include=["metadatas"])
    metadatas = result.get("metadatas", [])

    seen: dict[str, dict] = {}
    for meta in metadatas:
        doc_id = meta.get("doc_id")
        if doc_id and doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "filename": meta.get("filename", "unknown"),
            }

    return list(seen.values())
