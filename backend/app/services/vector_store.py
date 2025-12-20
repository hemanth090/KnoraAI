"""
Vector store service using Supabase pgvector.

Stores embeddings in PostgreSQL with the pgvector extension for
efficient similarity search.
"""
import logging
import numpy as np
from typing import List, Dict, Optional
from dataclasses import dataclass
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ChunkMetadata:
    """Metadata for a stored chunk."""
    chunk_id: str
    document_id: int
    page_number: int
    chunk_index: int
    text: str
    token_count: int


@dataclass
class SearchResult:
    """Result from a vector search."""
    chunk_id: str
    document_id: int
    page_number: int
    text: str
    score: float  # Similarity score (higher = more similar)


class PgVectorStore:
    """PostgreSQL pgvector-based vector store."""
    
    def __init__(self, dimension: int = None):
        """
        Initialize pgvector store.
        
        Args:
            dimension: Embedding dimension (384 for MiniLM)
        """
        self.dimension = dimension or settings.embedding_dimension
        logger.info(f"PgVectorStore initialized with dimension {self.dimension}")
    
    async def add_chunks(
        self,
        db: AsyncSession,
        chunks: List,  # List of Chunk objects from chunking_service
        embeddings: np.ndarray
    ) -> List[str]:
        """
        Add chunks with their embeddings to pgvector.
        
        Args:
            db: Database session
            chunks: List of Chunk objects with metadata
            embeddings: Numpy array of embeddings (n_chunks, dimension)
            
        Returns:
            List of chunk IDs added
        """
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks must match number of embeddings")
        
        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension {embeddings.shape[1]} "
                f"doesn't match store dimension {self.dimension}"
            )
        
        # Normalize embeddings for cosine similarity
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = embeddings / norms
        
        chunk_ids = []
        
        for chunk, embedding in zip(chunks, normalized):
            # Convert numpy array to list for PostgreSQL
            embedding_list = embedding.tolist()
            
            # Insert into pgvector table
            query = text("""
                INSERT INTO embeddings (document_id, chunk_id, page_number, chunk_index, text, token_count, embedding)
                VALUES (:document_id, :chunk_id, :page_number, :chunk_index, :text, :token_count, :embedding)
                ON CONFLICT (chunk_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    text = EXCLUDED.text
            """)
            
            await db.execute(query, {
                "document_id": chunk.document_id,
                "chunk_id": chunk.chunk_id,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "text": chunk.text,
                "token_count": chunk.token_count,
                "embedding": str(embedding_list)  # pgvector accepts string format
            })
            
            chunk_ids.append(chunk.chunk_id)
        
        await db.commit()
        logger.info(f"Added {len(chunks)} chunks to pgvector")
        return chunk_ids
    
    async def search(
        self,
        db: AsyncSession,
        query_embedding: np.ndarray,
        top_k: int = 5,
        document_id: Optional[int] = None,
        similarity_threshold: float = 0.0
    ) -> List[SearchResult]:
        """
        Search for similar chunks using pgvector.
        
        Args:
            db: Database session
            query_embedding: Query vector
            top_k: Number of results to return
            document_id: If specified, only search within this document
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of SearchResult objects sorted by similarity
        """
        # Normalize query embedding
        query = query_embedding.flatten()
        norm = np.linalg.norm(query)
        if norm > 0:
            query = query / norm
        
        embedding_str = str(query.tolist())
        
        # Build query with optional document filter
        # Use CAST() instead of :: to avoid SQLAlchemy parameter binding conflict
        if document_id:
            sql = text("""
                SELECT 
                    chunk_id,
                    document_id,
                    page_number,
                    text,
                    1 - (embedding <=> CAST(:embedding AS vector)) as similarity
                FROM embeddings
                WHERE document_id = :document_id
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :top_k
            """)
            params = {
                "embedding": embedding_str,
                "document_id": document_id,
                "top_k": top_k
            }
        else:
            sql = text("""
                SELECT 
                    chunk_id,
                    document_id,
                    page_number,
                    text,
                    1 - (embedding <=> CAST(:embedding AS vector)) as similarity
                FROM embeddings
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :top_k
            """)
            params = {
                "embedding": embedding_str,
                "top_k": top_k
            }
        
        result = await db.execute(sql, params)
        rows = result.fetchall()
        
        results = []
        for row in rows:
            score = float(row.similarity)
            if score >= similarity_threshold:
                results.append(SearchResult(
                    chunk_id=row.chunk_id,
                    document_id=row.document_id,
                    page_number=row.page_number,
                    text=row.text,
                    score=score
                ))
        
        logger.info(f"pgvector search returned {len(results)} results")
        return results
    
    async def delete_document(self, db: AsyncSession, document_id: int) -> int:
        """
        Delete all embeddings for a document.
        
        Args:
            db: Database session
            document_id: Document to delete
            
        Returns:
            Number of chunks deleted
        """
        # Count before delete
        count_query = text("""
            SELECT COUNT(*) FROM embeddings WHERE document_id = :document_id
        """)
        result = await db.execute(count_query, {"document_id": document_id})
        count = result.scalar() or 0
        
        # Delete
        delete_query = text("""
            DELETE FROM embeddings WHERE document_id = :document_id
        """)
        await db.execute(delete_query, {"document_id": document_id})
        await db.commit()
        
        logger.info(f"Deleted {count} embeddings for document {document_id}")
        return count
    
    async def get_document_chunks(self, db: AsyncSession, document_id: int) -> List[ChunkMetadata]:
        """Get all chunks for a specific document."""
        query = text("""
            SELECT chunk_id, document_id, page_number, chunk_index, text, token_count
            FROM embeddings
            WHERE document_id = :document_id
            ORDER BY page_number, chunk_index
        """)
        
        result = await db.execute(query, {"document_id": document_id})
        rows = result.fetchall()
        
        return [
            ChunkMetadata(
                chunk_id=row.chunk_id,
                document_id=row.document_id,
                page_number=row.page_number,
                chunk_index=row.chunk_index,
                text=row.text,
                token_count=row.token_count
            )
            for row in rows
        ]
    
    async def get_stats(self, db: AsyncSession) -> Dict:
        """Get statistics about the vector store."""
        query = text("""
            SELECT 
                COUNT(*) as total_chunks,
                COUNT(DISTINCT document_id) as total_documents
            FROM embeddings
        """)
        
        result = await db.execute(query)
        row = result.fetchone()
        
        return {
            "total_chunks": row.total_chunks if row else 0,
            "dimension": self.dimension,
            "documents": row.total_documents if row else 0
        }


# Singleton instance
_vector_store: Optional[PgVectorStore] = None


def get_vector_store(dimension: int = None) -> PgVectorStore:
    """Get or create the vector store singleton."""
    global _vector_store
    if _vector_store is None:
        _vector_store = PgVectorStore(dimension=dimension)
    return _vector_store