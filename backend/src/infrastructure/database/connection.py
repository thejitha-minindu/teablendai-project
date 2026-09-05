
"""
Shared database connection logic for SQLAlchemy engine.
"""
import logging
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm import declarative_base
from src.config import get_mssql_connection_string, get_settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def create_database_engine():
    connection_string = get_mssql_connection_string()
    settings = get_settings()
    logger.info(
        "Initializing MSSQL database engine: server='%s', port=%s, database='%s', "
        "user='%s', trusted=%s, driver='%s', encrypt=%s, trust_cert=%s",
        settings.MSSQL_SERVER,
        settings.MSSQL_PORT,
        settings.MSSQL_DATABASE,
        settings.MSSQL_USERNAME,
        settings.DB_TRUSTED_CONNECTION,
        settings.MSSQL_DRIVER,
        settings.MSSQL_ENCRYPT,
        settings.MSSQL_TRUST_SERVER_CERTIFICATE,
    )
    try:
        engine = create_engine(
            connection_string, 
            poolclass=NullPool, 
            echo=False,
            connect_args={"timeout": 30}
        )
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

# Shared engine instance
engine = create_database_engine()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI dependency that yields a database session.
    Usage in endpoints:
        def read_auctions(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
