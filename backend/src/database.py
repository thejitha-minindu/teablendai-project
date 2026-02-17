import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from langchain_community.utilities import SQLDatabase
from typing import Tuple
from sqlalchemy.orm import sessionmaker, Session

from src.infrastructure.database.base import Base

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

def _get_db_config() -> Tuple[str, str, str, str, bool]:
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
    """Create SQLAlchemy engine for MSSQL using pyodbc driver.

    Supports both Trusted Connection (Windows auth) and SQL auth.
    """
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
        engine = create_engine(connection_string, poolclass=NullPool, echo=False)
        return engine
    except Exception as e:
        raise RuntimeError(
            "Failed to create MSSQL engine. Ensure 'ODBC Driver 18 for SQL Server' is installed "
            "and DB_* (or MSSQL_*) environment variables are set correctly. "
            f"Attempted server='{server}', database='{database}', trusted={trusted}. "
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