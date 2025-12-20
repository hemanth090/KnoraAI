"""
API routers package.
"""
from app.routers.documents import router as documents_router
from app.routers.chat import router as chat_router

__all__ = ["documents_router", "chat_router"]