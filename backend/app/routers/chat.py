"""
Chat endpoint: accepts a question + optional document filter + chat history,
returns a grounded answer with source citations.
"""
import traceback
from fastapi import APIRouter, HTTPException

from app.models import ChatRequest, ChatResponse
from app.rag_chain import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Ask a question about the uploaded documents."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = answer_question(
            question=request.question,
            doc_ids=request.doc_ids or None,
            chat_history=request.chat_history or [],
        )
    except Exception as e:
        traceback.print_exc()  # prints full traceback to server console
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        doc_ids_used=result["doc_ids_used"],
    )
