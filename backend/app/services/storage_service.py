"""
Storage service for Supabase Storage operations.
"""
import logging
from typing import Optional
from app.services.supabase_client import get_storage
from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Service for handling file uploads/downloads with Supabase Storage."""
    
    def __init__(self, bucket_name: str = None):
        self.bucket_name = bucket_name or settings.storage_bucket
    
    async def upload_file(self, file_id: str, content: bytes, content_type: str = "application/pdf") -> str:
        """
        Upload a file to Supabase Storage.
        
        Args:
            file_id: Unique file identifier (used as filename)
            content: File content as bytes
            content_type: MIME type of the file
            
        Returns:
            Storage path of the uploaded file
        """
        file_path = f"{file_id}.pdf"
        
        try:
            storage = get_storage()
            bucket = storage.from_(self.bucket_name)
            
            # Upload file
            result = bucket.upload(
                path=file_path,
                file=content,
                file_options={"content-type": content_type}
            )
            
            logger.info(f"Uploaded file to Supabase Storage: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            raise
    
    async def download_file(self, file_path: str) -> bytes:
        """
        Download a file from Supabase Storage.
        
        Args:
            file_path: Path of the file in storage
            
        Returns:
            File content as bytes
        """
        try:
            storage = get_storage()
            bucket = storage.from_(self.bucket_name)
            
            # Download file
            result = bucket.download(file_path)
            
            logger.info(f"Downloaded file from Supabase Storage: {file_path}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to download file: {e}")
            raise
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from Supabase Storage.
        
        Args:
            file_path: Path of the file in storage
            
        Returns:
            True if deleted successfully
        """
        try:
            storage = get_storage()
            bucket = storage.from_(self.bucket_name)
            
            # Delete file
            bucket.remove([file_path])
            
            logger.info(f"Deleted file from Supabase Storage: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False
    
    def get_public_url(self, file_path: str) -> str:
        """
        Get public URL for a file.
        
        Args:
            file_path: Path of the file in storage
            
        Returns:
            Public URL string
        """
        storage = get_storage()
        bucket = storage.from_(self.bucket_name)
        return bucket.get_public_url(file_path)


# Singleton instance
storage_service = StorageService()
