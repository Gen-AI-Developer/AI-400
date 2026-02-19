from fastapi import logger
from sqlmodel import SQLModel, create_engine, Session
from config import get_settings

settings = get_settings()
logger.info(f"Connecting to database: {get_settings().database_url.split('@')[-1] if '@' in get_settings().database_url else 'local'}")
engine = create_engine(settings.database_url, echo=True)
print(f"Using database URL: {settings.database_url}")


# Create tables
def create_db_and_tables():
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine, checkfirst=True)
    logger.info("Database tables created/verified successfully")


# Dependency to get database session
def get_session():
    """Dependency that provides database sessions."""
    with Session(engine) as session:
        yield session
