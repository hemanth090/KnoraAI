"""
Embedding service using sentence-transformers.

Uses all-MiniLM-L6-v2 by default for fast, efficient embeddings.
Can be configured to use other models like bge-small-en-v1.5.
"""
import logging
import numpy as np
from typing import List, Union
from fastembed import TextEmbedding

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings."""
    
    def __init__(self, model_name: str = None):
        """
        Initialize embedding service with specified model.
        
        Args:
            model_name: Name of sentence-transformers model to use.
                       Defaults to config setting.
        """
        self.model_name = model_name or settings.embedding_model
        self.model = None
        # Lazy load: self._load_model() called only when needed
    
    def _ensure_model(self):
        """Ensure model is loaded."""
        if self.model is None:
            self._load_model()

    def _load_model(self):
        """Load the embedding model."""
        try:
            logger.info(f"Loading embedding model (fastembed): {self.model_name}")
            # FastEmbed handles model download and ONNX runtime automatically
            # It maps 'all-MiniLM-L6-v2' to a quantized ONNX version
            self.model = TextEmbedding(model_name=self.model_name)
            # FastEmbed doesn't strictly expose dimension property easily, 
            # but all-MiniLM-L6-v2 is known to be 384.
            # We can run a dummy encode to verify dimensions if needed.
            dummy_emb = list(self.model.embed(["test"]))[0]
            self.embedding_dimension = len(dummy_emb)
            
            logger.info(
                f"Loaded fastembed model with dimension: {self.embedding_dimension}"
            )
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Numpy array of embedding vector
        """
        if not text or not text.strip():
            raise ValueError("Cannot embed empty text")
        
        self._ensure_model()
        # fastembed.embed returns a generator, convert to list then numpy
        embedding = list(self.model.embed([text]))[0]
        return embedding.astype(np.float32)
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            Numpy array of shape (n_texts, embedding_dim)
        """
        if not texts:
            raise ValueError("Cannot embed empty list")
        
        # Filter empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            raise ValueError("All texts are empty")
        
        self._ensure_model()
        # fastembed.embed returns a generator
        embeddings_list = list(self.model.embed(valid_texts))
        return np.array(embeddings_list, dtype=np.float32)
    
    def embed_query(self, query: str) -> np.ndarray:
        """
        Generate embedding for a search query.
        
        Some models have different encoding for queries vs documents.
        This method handles that distinction.
        
        Args:
            query: Query text to embed
            
        Returns:
            Numpy array of embedding vector
        """
        if not query or not query.strip():
            raise ValueError("Cannot embed empty query")
        
        # For most sentence-transformers models, query and document
        # encoding is the same. Some BGE models use different prefixes.
        if "bge" in self.model_name.lower():
             # fastembed might handle this, but keeping manual prefix if raw model name used
             query = f"Represent this sentence for searching relevant passages: {query}"
        
        self._ensure_model()
        # fastembed handles prefixing internally if using BGE, but for standard models we just pass text
        embedding = list(self.model.embed([query]))[0]
        return embedding.astype(np.float32)
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model."""
        self._ensure_model()
        return self.embedding_dimension
    
    def compute_similarity(
        self,
        query_embedding: np.ndarray,
        document_embeddings: np.ndarray
    ) -> np.ndarray:
        """
        Compute cosine similarity between query and documents.
        
        Args:
            query_embedding: Query embedding vector
            document_embeddings: Document embedding matrix
            
        Returns:
            Array of similarity scores
        """
        # Normalize vectors
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        doc_norms = document_embeddings / np.linalg.norm(
            document_embeddings, axis=1, keepdims=True
        )
        
        # Compute cosine similarity
        similarities = np.dot(doc_norms, query_norm)
        return similarities


# Singleton instance
embedding_service = EmbeddingService()