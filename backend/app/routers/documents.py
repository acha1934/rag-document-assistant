"""
Document management endpoints: upload, list, delete.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from app.document_processor import process_document, LOADERS
from app.vector_store import add_documents, delete_document, list_documents
from app.models import UploadResponse, DeleteResponse
from app.config import settings
from pathlib import Path

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a document."""
    # Validate file type
    suffix = Path(file.filename).suffix.lower()
    if suffix not in LOADERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Supported: {', '.join(LOADERS.keys())}",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb} MB.",
        )

    # Process and index
    try:
        doc_id, chunks = process_document(file_bytes, file.filename)
        add_documents(chunks)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    return UploadResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunk_count=len(chunks),
        message=f"Successfully indexed '{file.filename}' into {len(chunks)} chunks.",
    )


@router.get("/", response_model=List[dict])
async def list_all_documents():
    """List all indexed documents."""
    try:
        return list_documents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_doc(doc_id: str):
    """Remove a document and all its chunks from the index."""
    try:
        delete_document(doc_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

    return DeleteResponse(doc_id=doc_id, message="Document deleted successfully.")
