-- Supabase pgvector setup for Knora AI
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for vector storage
-- This replaces the local FAISS index
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id VARCHAR(100) NOT NULL,
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding vector(384),  -- MiniLM-L6 uses 384 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_chunk UNIQUE (chunk_id)
);

-- Create index for fast similarity search
-- Using HNSW for better performance than IVFFlat
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx 
ON embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create index for document_id filtering
CREATE INDEX IF NOT EXISTS embeddings_document_id_idx 
ON embeddings (document_id);

-- Create storage bucket for PDFs (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', false);
