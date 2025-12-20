"""
Text chunking service with page-aware splitting and metadata preservation.

Key requirements:
- 500-800 tokens per chunk
- 100-150 token overlap
- Never mix content from different pages
- Preserve metadata: page number, source document, chunk ID
"""
import logging
import re
from typing import List, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """Represents a text chunk with metadata."""
    chunk_id: str
    document_id: int
    page_number: int
    chunk_index: int  # Index within the page
    text: str
    token_count: int


class ChunkingService:
    """Service for splitting document text into chunks."""
    
    def __init__(
        self,
        target_chunk_size: int = 600,  # Target tokens per chunk
        chunk_overlap: int = 100,  # Overlap tokens
        min_chunk_size: int = 100,  # Minimum tokens to form a chunk
    ):
        """
        Initialize chunking service.
        
        Args:
            target_chunk_size: Target number of tokens per chunk (500-800 recommended)
            chunk_overlap: Number of overlapping tokens between chunks
            min_chunk_size: Minimum tokens for a valid chunk
        """
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
        # Simple tokenization approximation: ~4 chars per token
        self.chars_per_token = 4
        
        logger.info(
            f"ChunkingService initialized: target={target_chunk_size}, "
            f"overlap={chunk_overlap}, min={min_chunk_size}"
        )
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text (approximation)."""
        if not text:
            return 0
        # Rough approximation: ~4 characters per token
        return len(text) // self.chars_per_token
    
    def chunk_document(
        self,
        document_id: int,
        pages: List[Dict],
        source_name: str = ""
    ) -> List[Chunk]:
        """
        Split document pages into chunks.
        
        CRITICAL: Never mix content from different pages.
        Each chunk belongs to exactly one page.
        
        Args:
            document_id: ID of the source document
            pages: List of page dicts with 'page_number' and 'text'
            source_name: Name of the source document
            
        Returns:
            List of Chunk objects with metadata
        """
        all_chunks = []
        
        for page in pages:
            page_number = page["page_number"]
            page_text = page["text"]
            
            if not page_text.strip():
                continue
            
            # Split this page into chunks
            page_chunks = self._chunk_page(
                document_id=document_id,
                page_number=page_number,
                text=page_text,
                source_name=source_name
            )
            
            all_chunks.extend(page_chunks)
        
        logger.info(
            f"Document {document_id}: Created {len(all_chunks)} chunks "
            f"from {len(pages)} pages"
        )
        
        return all_chunks
    
    def _chunk_page(
        self,
        document_id: int,
        page_number: int,
        text: str,
        source_name: str
    ) -> List[Chunk]:
        """
        Split a single page's text into chunks.
        
        Uses sentence-aware splitting to avoid breaking mid-sentence.
        """
        if not text.strip():
            return []
        
        # Split into sentences
        sentences = self._split_into_sentences(text)
        
        if not sentences:
            return []
        
        chunks = []
        current_chunk_sentences = []
        current_chunk_tokens = 0
        chunk_index = 0
        
        for sentence in sentences:
            sentence_tokens = self.estimate_tokens(sentence)
            
            # If adding this sentence exceeds target, finalize current chunk
            if (current_chunk_tokens + sentence_tokens > self.target_chunk_size 
                and current_chunk_tokens >= self.min_chunk_size):
                
                # Create chunk from accumulated sentences
                chunk_text = " ".join(current_chunk_sentences)
                chunk = Chunk(
                    chunk_id=f"doc{document_id}_p{page_number}_c{chunk_index}",
                    document_id=document_id,
                    page_number=page_number,
                    chunk_index=chunk_index,
                    text=chunk_text.strip(),
                    token_count=self.estimate_tokens(chunk_text)
                )
                chunks.append(chunk)
                chunk_index += 1
                
                # Start new chunk with overlap
                overlap_sentences = self._get_overlap_sentences(
                    current_chunk_sentences,
                    self.chunk_overlap
                )
                current_chunk_sentences = overlap_sentences
                current_chunk_tokens = sum(
                    self.estimate_tokens(s) for s in overlap_sentences
                )
            
            # Add sentence to current chunk
            current_chunk_sentences.append(sentence)
            current_chunk_tokens += sentence_tokens
        
        # Handle remaining text
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            if self.estimate_tokens(chunk_text) >= self.min_chunk_size:
                chunk = Chunk(
                    chunk_id=f"doc{document_id}_p{page_number}_c{chunk_index}",
                    document_id=document_id,
                    page_number=page_number,
                    chunk_index=chunk_index,
                    text=chunk_text.strip(),
                    token_count=self.estimate_tokens(chunk_text)
                )
                chunks.append(chunk)
            elif chunks:
                # Append to last chunk if too small
                chunks[-1].text += " " + chunk_text.strip()
                chunks[-1].token_count = self.estimate_tokens(chunks[-1].text)
            else:
                # Create chunk even if small (only chunk on page)
                chunk = Chunk(
                    chunk_id=f"doc{document_id}_p{page_number}_c{chunk_index}",
                    document_id=document_id,
                    page_number=page_number,
                    chunk_index=chunk_index,
                    text=chunk_text.strip(),
                    token_count=self.estimate_tokens(chunk_text)
                )
                chunks.append(chunk)
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences while preserving structure."""
        if not text.strip():
            return []
        
        # First, split by newlines to preserve paragraph structure
        paragraphs = text.split('\n')
        sentences = []
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # Split on sentence-ending punctuation followed by space and capital letter
            # or end of string
            parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])', para)
            
            for part in parts:
                part = part.strip()
                if part:
                    sentences.append(part)
        
        # If no sentences found, treat entire text as one sentence
        if not sentences:
            sentences = [text.strip()]
        
        return sentences
    
    def _get_overlap_sentences(
        self,
        sentences: List[str],
        target_overlap_tokens: int
    ) -> List[str]:
        """Get sentences from end of list that approximate overlap token count."""
        if not sentences:
            return []
        
        overlap_sentences = []
        overlap_tokens = 0
        
        # Take sentences from the end until we reach overlap target
        for sentence in reversed(sentences):
            sentence_tokens = self.estimate_tokens(sentence)
            if overlap_tokens + sentence_tokens <= target_overlap_tokens * 1.5:
                overlap_sentences.insert(0, sentence)
                overlap_tokens += sentence_tokens
            else:
                break
        
        return overlap_sentences


# Create singleton with default settings
chunking_service = ChunkingService(
    target_chunk_size=500,  # Reduced for better granularity
    chunk_overlap=100,
    min_chunk_size=50  # Reduced to allow smaller chunks
)