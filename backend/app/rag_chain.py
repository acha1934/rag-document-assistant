"""
RAG chain — calls Groq API directly (no LangChain LLM wrapper, zero version conflicts).
Embeddings: sentence-transformers local. LLM: Groq REST API via requests.
"""
from typing import List, Optional
import requests

from langchain.schema import Document
from app.config import settings
from app.vector_store import similarity_search


SYSTEM_PROMPT = """You are a helpful document assistant. Answer questions using ONLY the context below.
If the context does not contain the answer, say so honestly. Be concise and cite the source document name and page."""


def _format_docs(docs: List[Document]) -> str:
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("filename", "unknown")
        page = doc.metadata.get("page", "?")
        parts.append(f"[{i}] {source} (page {page}):\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def _build_sources(docs: List[Document]) -> List[dict]:
    sources = []
    seen = set()
    for doc in docs:
        key = (doc.metadata.get("filename"), doc.metadata.get("page"))
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": doc.metadata.get("filename", "unknown"),
                "page": doc.metadata.get("page"),
                "doc_id": doc.metadata.get("doc_id"),
                "excerpt": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
            })
    return sources


def _call_groq(system: str, user: str, history: list) -> str:
    """Call Groq chat completions API directly via requests."""
    messages = [{"role": "system", "content": system}]

    # Add last 3 turns of history
    for msg in history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": user})

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.llm_model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def answer_question(
    question: str,
    doc_ids: Optional[List[str]] = None,
    chat_history: Optional[list] = None,
) -> dict:
    # 1. Retrieve relevant chunks
    relevant_docs = similarity_search(question, doc_ids=doc_ids)

    if not relevant_docs:
        return {
            "answer": "I couldn't find relevant information in the uploaded documents to answer your question.",
            "sources": [],
            "doc_ids_used": [],
        }

    # 2. Build context
    context = _format_docs(relevant_docs)
    sources = _build_sources(relevant_docs)
    doc_ids_used = list({
        doc.metadata.get("doc_id") for doc in relevant_docs if doc.metadata.get("doc_id")
    })

    # 3. Call Groq directly
    system = f"{SYSTEM_PROMPT}\n\nContext:\n{context}"
    answer = _call_groq(system, question, chat_history or [])

    return {
        "answer": answer,
        "sources": sources,
        "doc_ids_used": doc_ids_used,
    }
