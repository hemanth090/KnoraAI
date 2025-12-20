"""
Main FastAPI application for Knora AI backend.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import documents_router, chat_router
from app.models import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Knora AI backend...")
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Knora AI backend...")


# Create FastAPI app
app = FastAPI(
    title="Knora AI",
    description="Document-grounded AI assistant with RAG capabilities",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
# CORS middleware for frontend
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

# Add production origins from env
if settings.allowed_origins:
    origins.extend([origin.strip() for origin in settings.allowed_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "name": "Knora AI",
        "version": "1.0.0",
        "description": "Document-grounded AI assistant"
    }


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        embedding_model=settings.embedding_model,
        llm_model=settings.llm_model
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )