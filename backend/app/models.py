"""
Database models and Pydantic schemas for Knora AI.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

Base = declarative_base()


# SQLAlchemy ORM Models
class Document(Base):
    """Represents an uploaded PDF document."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    page_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, processing, ready, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    """Represents a text chunk from a document."""
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_id = Column(String(100), nullable=False)  # e.g., "doc1_page2_chunk3"
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)  # order within page
    text = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)
    embedding_id = Column(String(100), nullable=True)  # reference in vector store
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")


class ChatSession(Base):
    """Represents a Q&A chat session."""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Represents a single message in a chat session."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)  # JSON array of source references
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")


# Pydantic Schemas for API
class DocumentCreate(BaseModel):
    """Schema for creating a document (via file upload)."""
    pass  # File upload handled separately


class DocumentResponse(BaseModel):
    """Schema for document response."""
    id: int
    filename: str
    original_name: str
    file_size: int
    page_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for list of documents."""
    documents: List[DocumentResponse]
    total: int


class ChunkResponse(BaseModel):
    """Schema for chunk response."""
    id: int
    chunk_id: str
    page_number: int
    chunk_index: int
    text: str
    token_count: int
    
    class Config:
        from_attributes = True


class SourceReference(BaseModel):
    """Schema for a source reference in an answer."""
    page: int
    text_snippet: str
    chunk_id: str
    relevance_score: float


class QueryRequest(BaseModel):
    """Schema for a Q&A query request."""
    question: str
    document_id: int
    session_id: Optional[int] = None


class QueryResponse(BaseModel):
    """Schema for a Q&A query response."""
    answer: str
    sources: List[SourceReference]
    session_id: int
    message_id: int


class ChatMessageResponse(BaseModel):
    """Schema for chat message response."""
    id: int
    role: str
    content: str
    sources: Optional[List[SourceReference]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    """Schema for chat session response."""
    id: int
    document_id: int
    document_name: Optional[str] = None
    title: Optional[str] = None
    messages: List[ChatMessageResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatSessionListResponse(BaseModel):
    """Schema for list of chat sessions."""
    sessions: List[ChatSessionResponse]
    total: int


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    version: str
    embedding_model: str
    llm_model: str