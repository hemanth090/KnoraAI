"""
LLM service with hallucination-proof prompting for RAG.

Key requirements:
- Only answer from provided context
- Must cite page numbers with [page:X] format
- If answer not in context, say "I don't know"
- Never make up information
"""
import logging
import json
from typing import List, Dict, Optional
from openai import OpenAI

from app.config import settings
from app.services.vector_store import SearchResult

logger = logging.getLogger(__name__)


# System prompt designed to prevent hallucinations
SYSTEM_PROMPT = """You are Knora AI, a document-grounded assistant. Your ONLY job is to answer questions based EXCLUSIVELY on the provided PDF excerpts.

## STRICT RULES:
1. ONLY use information from the provided context excerpts
2. ALWAYS cite your sources using [page:X] format where X is the page number
3. If the answer is NOT in the provided context, respond with: "I could not find information about this in the document."
4. NEVER make up or infer information not explicitly stated in the context
5. NEVER use external knowledge or information from your training data
6. Quote relevant passages when helpful, using quotation marks
7. If multiple pages contain relevant information, cite all of them

## CITATION FORMAT:
- Inline citations: "The revenue increased by 15% [page:12]"
- Multiple sources: "As stated in the report [page:4, page:8]"
- Direct quotes: "The document states: 'exact quote here' [page:3]"

## RESPONSE FORMAT:
- Start with a direct answer to the question
- Support with evidence from the context
- Include all relevant page citations
- Be concise but complete

Remember: It's better to say "I don't know" than to make up an answer."""


class LLMService:
    """Service for generating RAG answers with citations."""
    
    def __init__(self, model: str = None, api_key: str = None):
        """
        Initialize LLM service.
        
        Args:
            model: OpenAI model to use
            api_key: OpenAI API key
        """
        self.model = model or settings.llm_model
        api_key = api_key or settings.groq_api_key
        
        if not api_key:
            logger.warning("Groq API key not configured")
            self.client = None
        else:
            self.client = OpenAI(
                api_key=api_key,
                base_url=settings.groq_base_url
            )
        
        logger.info(f"LLM Service initialized with model: {self.model}")
    
    def generate_answer(
        self,
        question: str,
        context_chunks: List[SearchResult],
        document_name: str = "the document",
        chat_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Generate an answer based on retrieved context.
        
        Args:
            question: User's question
            context_chunks: Retrieved relevant chunks with page numbers
            document_name: Name of the source document
            chat_history: Previous messages in conversation
            
        Returns:
            Dict with 'answer' and 'sources' keys
        """
        if not self.client:
            return {
                "answer": "LLM service is not configured. Please set your Groq API key.",
                "sources": []
            }
        
        if not context_chunks:
            return {
                "answer": "I could not find any relevant information in the document to answer your question.",
                "sources": []
            }
        
        # Build context from chunks
        context = self._build_context(context_chunks, document_name)
        
        # Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add chat history if provided
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 exchanges
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current question with context
        user_message = f"""## Document: {document_name}

## Context Excerpts:
{context}

## Question:
{question}

Please answer the question using ONLY the information from the context excerpts above. Remember to cite page numbers using [page:X] format."""

        messages.append({"role": "user", "content": user_message})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,  # Low temperature for factual responses
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            
            # Extract cited pages from answer
            sources = self._extract_sources(answer, context_chunks)
            
            return {
                "answer": answer,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return {
                "answer": f"I encountered an error generating the response: {str(e)}",
                "sources": []
            }
    
    def _build_context(
        self,
        chunks: List[SearchResult],
        document_name: str
    ) -> str:
        """Build context string from chunks."""
        context_parts = []
        
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(
                f"[Excerpt {i} - Page {chunk.page_number}]\n{chunk.text}"
            )
        
        return "\n\n---\n\n".join(context_parts)
    
    def _extract_sources(
        self,
        answer: str,
        context_chunks: List[SearchResult]
    ) -> List[Dict]:
        """Extract source references from the answer."""
        import re
        
        # Find all page citations in the answer
        page_pattern = r'\[page:(\d+)\]'
        cited_pages = set(int(p) for p in re.findall(page_pattern, answer))
        
        # Map cited pages to their chunks
        sources = []
        seen_pages = set()
        
        for chunk in context_chunks:
            if chunk.page_number in cited_pages and chunk.page_number not in seen_pages:
                sources.append({
                    "page": chunk.page_number,
                    "text_snippet": chunk.text[:200] + "..." if len(chunk.text) > 200 else chunk.text,
                    "chunk_id": chunk.chunk_id,
                    "relevance_score": chunk.score
                })
                seen_pages.add(chunk.page_number)
        
        # Sort by page number
        sources.sort(key=lambda x: x["page"])
        
        return sources
    
    def generate_title(self, question: str, answer: str) -> str:
        """Generate a title for a chat session based on first Q&A."""
        if not self.client:
            return question[:50] + "..." if len(question) > 50 else question
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a brief, descriptive title (max 50 chars) for this Q&A session. Return only the title, nothing else."
                    },
                    {
                        "role": "user",
                        "content": f"Question: {question}\nAnswer: {answer[:200]}"
                    }
                ],
                temperature=0.3,
                max_tokens=30
            )
            
            title = response.choices[0].message.content.strip()
            return title[:50] if len(title) > 50 else title
            
        except Exception as e:
            logger.error(f"Title generation failed: {e}")
            return question[:50] + "..." if len(question) > 50 else question


# Singleton instance
llm_service = LLMService()