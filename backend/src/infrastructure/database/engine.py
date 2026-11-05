"""One bounded SQLAlchemy connection pool per application process."""
from functools import lru_cache

from sqlalchemy import create_engine, event

from src.config import get_mssql_connection_string, get_settings


@lru_cache(maxsize=1)
def get_database_engine():
    settings = get_settings()
    engine = create_engine(
        get_mssql_connection_string(),
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_pre_ping=True,
        connect_args={"timeout": settings.DATABASE_CONNECT_TIMEOUT_SECONDS},
        implicit_returning=False,
        echo=False,
    )

    if engine.dialect.name == "mssql" and engine.dialect.driver == "pyodbc":
        @event.listens_for(engine, "do_connect")
        def connect_with_query_timeout(dialect, _record, args, kwargs):
            # pyodbc's connect timeout only covers login, not SQL execution/locks.
            # Set this before SQLAlchemy's first-connection initialization queries.
            connection = dialect.loaded_dbapi.connect(*args, **kwargs)
            connection.timeout = settings.DATABASE_QUERY_TIMEOUT_SECONDS
            return connection

    return engine
