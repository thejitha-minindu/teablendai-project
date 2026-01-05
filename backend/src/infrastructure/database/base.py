"""
SQLAlchemy Base Configuration

This file sets up the foundation for all ORM models.
All domain models will inherit from this Base class.
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from .connection import engine

# Create Session Factory
# SessionLocal is a factory for creating database sessions
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,  
    autoflush=False, 
    expire_on_commit=False 
)

# Create Base Class
Base = declarative_base()

def get_db():
    """
    Dependency injection for database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database Initialization
def init_db():
    """
    Initialize database (create all tables)
    Note: Since we created tables with SQL, this is optional.
    """
    from src.domain.models.conversation import Conversation
    from src.domain.models.message import Message

    Base.metadata.create_all(bind=engine)
    print("Database initialized!")


def test_connection():
    """
    Test if database connection works
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("Database connection successful!")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

if __name__ == "__main__":
    # Test the connection
    test_connection()