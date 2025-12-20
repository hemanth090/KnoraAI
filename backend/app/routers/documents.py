"""
API routes for document management (upload, list, delete).
Uses Supabase Storage for file uploads.
"""
import uuid
import logging
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.config import settings
from app.models import Document, DocumentResponse, DocumentListResponse
from app.services.rag_service import rag_service
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a PDF document for processing.
    
    The document will be:
    1. Uploaded to Supabase Storage
    2. Processed in the background:
       - Text extraction
       - Chunking
       - Embedding generation
       - pgvector storage
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Check file size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.max_file_size_mb}MB"
        )
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    try:
        # Upload to Supabase Storage
        storage_path = await storage_service.upload_file(file_id, contents)
        logger.info(f"Uploaded file to Supabase Storage: {storage_path}")
    except Exception as e:
        logger.error(f"Failed to upload to Supabase Storage: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Create pending document record
    doc = Document(
        filename=f"{file_id}.pdf",
        original_name=file.filename,
        file_path=storage_path,  # Supabase Storage path
        file_size=file_size,
        status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    # Process in background
    background_tasks.add_task(
        process_document,
        document_id=doc.id,
        file_path=storage_path,
        original_name=file.filename,
        file_size=file_size
    )
    
    logger.info(f"Document {doc.id} uploaded to Supabase, processing started")
    
    return DocumentResponse.model_validate(doc)


async def process_document(
    document_id: int,
    file_path: str,
    original_name: str,
    file_size: int
):
    """Background task to process uploaded document."""
    from app.database import async_session
    
    async with async_session() as db:
        try:
            # Get document
            doc = await db.get(Document, document_id)
            if not doc:
                logger.error(f"Document {document_id} not found")
                return
            
            # Update status
            doc.status = "processing"
            await db.commit()
            
            # Run ingestion (downloads from Supabase Storage)
            await rag_service.ingest_document(
                db=db,
                document_id=document_id,
                file_path=file_path,
                original_name=original_name,
                file_size=file_size
            )
            
        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            doc = await db.get(Document, document_id)
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)
                await db.commit()


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    db: AsyncSession = Depends(get_db)
):
    """List all uploaded documents with optional filtering."""
    query = select(Document).order_by(Document.created_at.desc())
    
    if status:
        query = query.where(Document.status == status)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    # Get total count
    count_query = select(func.count(Document.id))
    if status:
        count_query = count_query.where(Document.status == status)
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=total
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific document."""
    doc = await db.get(Document, document_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a document and all associated data (including from Supabase Storage)."""
    deleted = await rag_service.delete_document(db, document_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/stats")
async def get_document_stats(
    document_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get processing statistics for a document."""
    doc = await db.get(Document, document_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    stats = await rag_service.get_document_stats(db, document_id)
    
    return {
        "document_id": document_id,
        "status": doc.status,
        "page_count": doc.page_count,
        **stats
    }