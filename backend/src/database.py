from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from langchain_community.utilities import SQLDatabase
from sqlalchemy.orm import sessionmaker, Session

from src.infrastructure.database.base import Base
from src.config import get_mssql_connection_string, get_settings

# Create a session factory (singleton)
_ENGINE = None
_SessionLocal = None

def _init_session_factory():
    global _ENGINE, _SessionLocal
    if _ENGINE is None:
        _ENGINE = create_database_connection()
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=_ENGINE
        )

def create_database_connection():
    """Create SQLAlchemy engine for MSSQL using pyodbc driver.

    Supports both Trusted Connection (Windows auth) and SQL auth.
    """
    connection_string = get_mssql_connection_string()

    try:
        engine = create_engine(connection_string, poolclass=NullPool, echo=False)
        return engine
    except Exception as e:
        settings = get_settings()
        raise RuntimeError(
            "Failed to create MSSQL engine. Ensure the configured ODBC driver is installed "
            "and MSSQL_* / DATABASE_URL environment variables are set correctly. "
            f"Attempted server='{settings.MSSQL_SERVER}', database='{settings.MSSQL_DATABASE}', "
            f"trusted={settings.DB_TRUSTED_CONNECTION}. "
            f"Original error: {e}"
        )
    
def create_database_table():
    engine = create_database_connection()

    tea_tables = [
        'Customer', 
        'TeaPurchase', 
        'TeaBlendSale', 
        'BlendComposition', 
        'BlendPurchaseMapping'
    ]

    db = SQLDatabase(
        engine, 
        include_tables=tea_tables,
        sample_rows_in_table_info=2
    )

    return engine, db

def get_engine():
    return create_database_connection()

def test_connection():
    try:
        engine = create_database_connection()
        with engine.connect() as connection:
            result = connection.execute(text("SELECT @@VERSION"))
            version = result.fetchone()[0]
            print(f"Connected to SQL Server: {version[:50]}...")
            return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False
        
def get_db():
    """
    FastAPI dependency that provides a SQLAlchemy Session and ensures it is closed.
    Usage: db: Session = Depends(get_db)
    """
    _init_session_factory()

    db: Session = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
