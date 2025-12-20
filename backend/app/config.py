"""
Configuration settings for Knora AI backend.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenAI settings
    openai_api_key: str = ""
    openai_base_url: Optional[str] = "https://api.openai.com/v1"
    
    # Model settings
    llm_model: str = "gpt-4-turbo-preview"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384  # Dimension for MiniLM
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Supabase settings
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_db_password: str = ""
    
    # Direct database URL (override for Supabase PostgreSQL)
    database_url: Optional[str] = None
    
    def get_database_url(self) -> str:
        """Get PostgreSQL connection string."""
        # If DATABASE_URL is set directly, use it
        if self.database_url:
            return self.database_url
        
        # Build from Supabase credentials (direct connection, not pooler)
        if self.supabase_url and self.supabase_db_password:
            project_ref = self.supabase_url.replace("https://", "").split(".")[0]
            # Use direct connection on port 5432 (not pooler)
            return f"postgresql+asyncpg://postgres:{self.supabase_db_password}@db.{project_ref}.supabase.co:5432/postgres"
        
        return "sqlite+aiosqlite:///./knora.db"  # Fallback for local dev
    
    # Storage bucket
    storage_bucket: str = "documents"
    
    # Upload settings
    max_file_size_mb: int = 50
    
    # Chunking settings
    chunk_size: int = 600  # tokens
    chunk_overlap: int = 100  # tokens
    
    # Retrieval settings
    top_k_results: int = 10  # Increased for better recall
    similarity_threshold: float = 0.0  # No threshold - return all matches
    
    # Deployment settings
    allowed_origins: Optional[str] = None  # Comma-separated list of origins
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
