"""
Supabase client initialization for backend services.
"""
from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Client = None


def get_supabase_client() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ValueError(
                "Supabase credentials not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            )
        
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
        logger.info("Supabase client initialized")
    
    return _supabase_client


# Convenience function for storage operations
def get_storage():
    """Get Supabase Storage client."""
    return get_supabase_client().storage
