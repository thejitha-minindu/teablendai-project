"""
SQLAlchemy base configuration shared by domain and repository models.
"""
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from src.config import get_mssql_connection_string, get_settings

load_dotenv()

Base = declarative_base()


def create_database_connection():
    connection_string = get_mssql_connection_string()

    try:
        return create_engine(
            connection_string,
            poolclass=NullPool,
            echo=False,
            implicit_returning=False,
        )
    except Exception as e:
        settings = get_settings()
        raise RuntimeError(
            "Failed to create MSSQL engine. Ensure the configured ODBC driver is installed "
            "and MSSQL_* / DATABASE_URL environment variables are set correctly. "
            f"Attempted server='{settings.MSSQL_SERVER}', database='{settings.MSSQL_DATABASE}', "
            f"trusted={settings.DB_TRUSTED_CONNECTION}. "
            f"Original error: {e}"
        )


engine = create_database_connection()
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db():
    """Dependency injection helper for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables from mapped metadata."""
    from src.domain.models.conversation import Conversation  # noqa: F401
    from src.domain.models.message import ChatMessage  # noqa: F401

    Base.metadata.create_all(bind=engine)
    print("Database initialized!")


def test_connection():
    """Test whether database connection works."""
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
    test_connection()
