import os

from models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./pawcation.db"

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized successfully!")


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
