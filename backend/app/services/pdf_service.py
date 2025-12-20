"""
PDF processing service with page-level text extraction.
"""
import os
import logging
from typing import List, Dict, Tuple
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

logger = logging.getLogger(__name__)


class PDFService:
    """Service for extracting text from PDF documents page by page."""
    
    def __init__(self):
        """Initialize the PDF service with available libraries."""
        if pdfplumber is None and PdfReader is None:
            raise ImportError("Either pdfplumber or pypdf must be installed")
        
        # Prefer pdfplumber for better table/layout handling
        self.use_pdfplumber = pdfplumber is not None
        logger.info(f"PDF Service initialized with {'pdfplumber' if self.use_pdfplumber else 'pypdf'}")
    
    def extract_pages(self, file_path: str) -> List[Dict]:
        """
        Extract text from each page of a PDF.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            List of dicts with page_number and text for each page
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        pages = []
        
        if self.use_pdfplumber:
            pages = self._extract_with_pdfplumber(file_path)
        else:
            pages = self._extract_with_pypdf(file_path)
        
        logger.info(f"Extracted {len(pages)} pages from {file_path}")
        return pages
    
    def _extract_with_pdfplumber(self, file_path: str) -> List[Dict]:
        """Extract text using pdfplumber (better for complex layouts)."""
        pages = []
        
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                
                # Clean up the extracted text
                text = self._clean_text(text)
                
                if text.strip():  # Only include pages with content
                    pages.append({
                        "page_number": i + 1,  # 1-indexed
                        "text": text,
                        "char_count": len(text)
                    })
        
        return pages
    
    def _extract_with_pypdf(self, file_path: str) -> List[Dict]:
        """Extract text using pypdf (fallback)."""
        pages = []
        
        reader = PdfReader(file_path)
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            
            # Clean up the extracted text
            text = self._clean_text(text)
            
            if text.strip():  # Only include pages with content
                pages.append({
                    "page_number": i + 1,  # 1-indexed
                    "text": text,
                    "char_count": len(text)
                })
        
        return pages
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text by removing excessive whitespace."""
        if not text:
            return ""
        
        # Replace multiple spaces with single space
        import re
        text = re.sub(r' +', ' ', text)
        
        # Replace multiple newlines with double newline
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def get_page_count(self, file_path: str) -> int:
        """Get the total number of pages in a PDF."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        if self.use_pdfplumber:
            with pdfplumber.open(file_path) as pdf:
                return len(pdf.pages)
        else:
            reader = PdfReader(file_path)
            return len(reader.pages)
    
    def validate_pdf(self, file_path: str) -> Tuple[bool, str]:
        """
        Validate that a file is a readable PDF.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not os.path.exists(file_path):
            return False, "File not found"
        
        if not file_path.lower().endswith('.pdf'):
            return False, "File is not a PDF"
        
        try:
            page_count = self.get_page_count(file_path)
            if page_count == 0:
                return False, "PDF has no pages"
            return True, ""
        except Exception as e:
            return False, f"Invalid PDF: {str(e)}"


# Singleton instance
pdf_service = PDFService()