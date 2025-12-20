"""
RAG (Retrieval-Augmented Generation) orchestration service.

Coordinates the full pipeline:
1. PDF ingestion and processing (from Supabase Storage)
2. Chunking and embedding
3. Vector storage (pgvector)
4. Query retrieval
5. LLM answer generation with citations
"""
import os
import logging
import tempfile
from typing import List, Dict, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models import Document, Chunk as ChunkModel, ChatSession, ChatMessage
from app.services.pdf_service import pdf_service
from app.services.chunking_service import chunking_service
from app.services.embedding_service import embedding_service
from app.services.vector_store import get_vector_store
from app.services.llm_service import llm_service
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class RAGService:
    """Main service orchestrating the RAG pipeline."""
    
    def __init__(self):
        """Initialize RAG service with required components."""
        self.pdf_service = pdf_service
        self.chunking_service = chunking_service
        self.embedding_service = embedding_service
        self.vector_store = get_vector_store(
            dimension=self.embedding_service.get_dimension()
        )
        self.llm_service = llm_service
        self.storage_service = storage_service
        
        logger.info("RAG Service initialized with Supabase integration")
    
    async def ingest_document(
        self,
        db: AsyncSession,
        document_id: int,
        file_path: str,
        original_name: str,
        file_size: int
    ) -> Document:
        """
        Ingest a PDF document into the RAG system.
        
        Pipeline:
        1. Download PDF from Supabase Storage
        2. Validate PDF
        3. Extract text page by page
        4. Chunk text (never mixing pages)
        5. Generate embeddings
        6. Store in pgvector
        
        Args:
            db: Database session
            document_id: ID of existing document record
            file_path: Path in Supabase Storage
            original_name: Original filename
            file_size: File size in bytes
            
        Returns:
            Document model with processing status
        """
        # Get existing document
        doc = await db.get(Document, document_id)
        if not doc:
            raise ValueError(f"Document {document_id} not found")
        
        doc.status = "processing"
        await db.commit()
        
        temp_file_path = None
        
        try:
            # Download PDF from Supabase Storage to temp file
            logger.info(f"Downloading PDF from storage: {file_path}")
            pdf_content = await self.storage_service.download_file(file_path)
            
            # Write to temp file for processing
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
                temp_file.write(pdf_content)
                temp_file_path = temp_file.name
            
            # Validate PDF
            is_valid, error = self.pdf_service.validate_pdf(temp_file_path)
            if not is_valid:
                doc.status = "failed"
                doc.error_message = error
                await db.commit()
                return doc
            
            # Extract pages
            pages = self.pdf_service.extract_pages(temp_file_path)
            doc.page_count = len(pages)
            
            if not pages:
                doc.status = "failed"
                doc.error_message = "No text content found in PDF"
                await db.commit()
                return doc
            
            # Chunk document
            chunks = self.chunking_service.chunk_document(
                document_id=doc.id,
                pages=pages,
                source_name=original_name
            )
            
            if not chunks:
                doc.status = "failed"
                doc.error_message = "Failed to create chunks from document"
                await db.commit()
                return doc
            
            # Generate embeddings
            texts = [chunk.text for chunk in chunks]
            embeddings = self.embedding_service.embed_texts(texts)
            
            # Store in pgvector (async)
            await self.vector_store.add_chunks(db, chunks, embeddings)
            
            # Save chunk records to database (for reference)
            for chunk in chunks:
                chunk_model = ChunkModel(
                    document_id=doc.id,
                    chunk_id=chunk.chunk_id,
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    text=chunk.text,
                    token_count=chunk.token_count,
                    embedding_id=chunk.chunk_id
                )
                db.add(chunk_model)
            
            # Update document status
            doc.status = "ready"
            await db.commit()
            
            logger.info(
                f"Document {doc.id} ingested: {len(pages)} pages, "
                f"{len(chunks)} chunks"
            )
            
            return doc
            
        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")
            doc.status = "failed"
            doc.error_message = str(e)
            await db.commit()
            return doc
            
        finally:
            # Cleanup temp file
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    async def query(
        self,
        db: AsyncSession,
        question: str,
        document_id: int,
        session_id: Optional[int] = None
    ) -> Dict:
        """
        Answer a question using RAG.
        
        Pipeline:
        1. Embed the question
        2. Retrieve relevant chunks from pgvector
        3. Generate answer with citations
        4. Save to chat history
        
        Args:
            db: Database session
            question: User's question
            document_id: ID of document to query
            session_id: Existing chat session ID (optional)
            
        Returns:
            Dict with answer, sources, session_id, message_id
        """
        # Get document
        doc = await db.get(Document, document_id)
        if not doc:
            raise ValueError(f"Document {document_id} not found")
        
        if doc.status != "ready":
            raise ValueError(f"Document is not ready for queries (status: {doc.status})")
        
        # Get or create chat session
        if session_id:
            session = await db.get(ChatSession, session_id)
            if not session or session.document_id != document_id:
                raise ValueError("Invalid session")
        else:
            session = ChatSession(
                document_id=document_id,
                title=None  # Will be set after first response
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
        
        # Get chat history for context
        history_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history_messages = list(reversed(history_result.scalars().all()))
        
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
        ]
        
        # Embed question
        query_embedding = self.embedding_service.embed_query(question)
        
        # Retrieve relevant chunks from pgvector (async)
        results = await self.vector_store.search(
            db=db,
            query_embedding=query_embedding,
            top_k=settings.top_k_results,
            document_id=document_id,
            similarity_threshold=settings.similarity_threshold
        )
        
        # Generate answer
        response = self.llm_service.generate_answer(
            question=question,
            context_chunks=results,
            document_name=doc.original_name,
            chat_history=chat_history
        )
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=question
        )
        db.add(user_msg)
        
        # Save assistant message
        import json
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response["answer"],
            sources=json.dumps(response["sources"]) if response["sources"] else None
        )
        db.add(assistant_msg)
        
        # Update session title if first message
        if not session.title and len(history_messages) == 0:
            session.title = self.llm_service.generate_title(
                question, response["answer"]
            )
        
        session.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(assistant_msg)
        
        return {
            "answer": response["answer"],
            "sources": response["sources"],
            "session_id": session.id,
            "message_id": assistant_msg.id
        }
    
    async def delete_document(self, db: AsyncSession, document_id: int) -> bool:
        """
        Delete a document and all its associated data.
        
        Args:
            db: Database session
            document_id: ID of document to delete
            
        Returns:
            True if deleted, False if not found
        """
        doc = await db.get(Document, document_id)
        if not doc:
            return False
        
        # Delete embeddings from pgvector
        await self.vector_store.delete_document(db, document_id)
        
        # Delete file from Supabase Storage
        if doc.file_path:
            await self.storage_service.delete_file(doc.file_path)
        
        # Delete from database (cascades to chunks and sessions)
        await db.delete(doc)
        await db.commit()
        
        logger.info(f"Document {document_id} deleted from pgvector and storage")
        return True
    
    async def get_document_stats(self, db: AsyncSession, document_id: int) -> Dict:
        """Get statistics for a document in the vector store."""
        chunks = await self.vector_store.get_document_chunks(db, document_id)
        
        if not chunks:
            return {
                "total_chunks": 0,
                "pages_covered": [],
                "total_tokens": 0
            }
        
        pages = set(c.page_number for c in chunks)
        tokens = sum(c.token_count for c in chunks)
        
        return {
            "total_chunks": len(chunks),
            "pages_covered": sorted(pages),
            "total_tokens": tokens
        }


# Singleton instance
rag_service = RAGService()