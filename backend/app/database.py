"""
Database connection and session management.
Uses Supabase PostgreSQL via asyncpg.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base
import logging

logger = logging.getLogger(__name__)


# Create async engine (PostgreSQL or SQLite fallback)
engine = create_async_engine(
    settings.get_database_url(),
    echo=False,
    future=True,
    pool_pre_ping=True,  # Check connection health
    pool_size=5,
    max_overflow=10
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db():
    """Initialize the database by creating all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")


async def get_db():
    """Dependency for getting async database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
