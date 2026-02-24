"""
SQLAlchemy Base Configuration

This file sets up the foundation for all ORM models.
All domain models will inherit from this Base class.
"""

import os

from dotenv import load_dotenv


from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import NullPool, create_engine, text

load_dotenv()

Base = declarative_base()

Base = declarative_base()

def _get_db_config():
    server = os.getenv('MSSQL_SERVER')
    database = os.getenv('MSSQL_DATABASE')
    username = os.getenv('MSSQL_USERNAME') or ''
    password = os.getenv('MSSQL_PASSWORD') or ''
    trusted_env = os.getenv('DB_TRUSTED_CONNECTION')

    if trusted_env is None:
        trusted_env = os.getenv('MSSQL_TRUSTED_CONNECTION')
    trusted = False if trusted_env is None else str(trusted_env).lower() in ('1','true','yes','y')
    return server, database, username, password, trusted

def create_database_connection():
    server, database, username, password, trusted = _get_db_config()

    driver = "ODBC Driver 18 for SQL Server"
    if trusted or (not username and not password):
        connection_string = (
            f"mssql+pyodbc://{server}/{database}"
            f"?driver={driver.replace(' ', '+')}"
            f"&trusted_connection=yes"
            f"&TrustServerCertificate=yes"
        )
    else:
        connection_string = (
            f"mssql+pyodbc://{username}:{password}@{server}/{database}"
            f"?driver={driver.replace(' ', '+')}"
            f"&TrustServerCertificate=yes"
        )

    try:
        # Create SQLAlchemy Engine
        # Engine manages database connections
        engine = create_engine(
            connection_string, 
            poolclass=NullPool, 
            echo=False,
            implicit_returning=False
        )
        return engine
    except Exception as e:
        raise RuntimeError(
            "Failed to create MSSQL engine. Ensure 'ODBC Driver 18 for SQL Server' is installed "
            "and DB_* (or MSSQL_*) environment variables are set correctly. "
            f"Attempted server='{server}', database='{database}', trusted={trusted}. "
            f"Original error: {e}"
        )

# Create Engine Instance
engine = create_database_connection()

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
    from src.domain.models.message import ChatMessage

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