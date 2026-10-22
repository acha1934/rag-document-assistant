from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    uploaded_at: datetime


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    sources: Optional[List[dict]] = None


class ChatRequest(BaseModel):
    question: str
    doc_ids: Optional[List[str]] = None  # None means search all docs
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    doc_ids_used: List[str]


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    message: str


class DeleteResponse(BaseModel):
    doc_id: str
    message: str
