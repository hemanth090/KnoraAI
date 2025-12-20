"""
API routes for Q&A chat functionality.
"""
import json
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    Document, ChatSession, ChatMessage,
    QueryRequest, QueryResponse,
    ChatSessionResponse, ChatSessionListResponse,
    ChatMessageResponse, SourceReference
)
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=QueryResponse)
async def query_document(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ask a question about a document.
    
    Returns an answer with page citations based on the document content.
    Creates a new chat session if session_id is not provided.
    """
    # Validate document exists and is ready
    doc = await db.get(Document, request.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready for queries. Status: {doc.status}"
        )
    
    try:
        result = await rag_service.query(
            db=db,
            question=request.question,
            document_id=request.document_id,
            session_id=request.session_id
        )
        
        return QueryResponse(
            answer=result["answer"],
            sources=[SourceReference(**s) for s in result["sources"]],
            session_id=result["session_id"],
            message_id=result["message_id"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail="Query processing failed")


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(
    document_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List all chat sessions, optionally filtered by document."""
    query = (
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .order_by(ChatSession.updated_at.desc())
    )
    
    if document_id:
        query = query.where(ChatSession.document_id == document_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    sessions = result.scalars().unique().all()
    
    # Get total count
    count_query = select(func.count(ChatSession.id))
    if document_id:
        count_query = count_query.where(ChatSession.document_id == document_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Build response with document names
    session_responses = []
    for session in sessions:
        # Get document name
        doc = await db.get(Document, session.document_id)
        doc_name = doc.original_name if doc else "Unknown"
        
        # Parse sources for each message
        messages = []
        for msg in session.messages:
            sources = None
            if msg.sources:
                try:
                    sources = [SourceReference(**s) for s in json.loads(msg.sources)]
                except:
                    sources = None
            
            messages.append(ChatMessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                sources=sources,
                created_at=msg.created_at
            ))
        
        session_responses.append(ChatSessionResponse(
            id=session.id,
            document_id=session.document_id,
            document_name=doc_name,
            title=session.title,
            messages=messages,
            created_at=session.created_at,
            updated_at=session.updated_at
        ))
    
    return ChatSessionListResponse(
        sessions=session_responses,
        total=total
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat session with all messages."""
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get document name
    doc = await db.get(Document, session.document_id)
    doc_name = doc.original_name if doc else "Unknown"
    
    # Parse sources for each message
    messages = []
    for msg in sorted(session.messages, key=lambda m: m.created_at):
        sources = None
        if msg.sources:
            try:
                sources = [SourceReference(**s) for s in json.loads(msg.sources)]
            except:
                sources = None
        
        messages.append(ChatMessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            sources=sources,
            created_at=msg.created_at
        ))
    
    return ChatSessionResponse(
        id=session.id,
        document_id=session.document_id,
        document_name=doc_name,
        title=session.title,
        messages=messages,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session and all its messages."""
    session = await db.get(ChatSession, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.delete(session)
    await db.commit()
    
    return {"message": "Session deleted successfully"}


@router.post("/sessions/{session_id}/continue", response_model=QueryResponse)
async def continue_session(
    session_id: int,
    request: QueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """Continue an existing chat session with a new question."""
    # Get session
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Override request values
    request.session_id = session_id
    request.document_id = session.document_id
    
    return await query_document(request, db)