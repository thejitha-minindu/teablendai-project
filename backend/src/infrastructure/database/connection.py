"""
Shared database connection logic for SQLAlchemy engine.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

load_dotenv()

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

def create_database_engine():
    server, database, username, password, trusted = _get_db_config()
    driver = "ODBC Driver 17 for SQL Server"
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

# Shared engine instance
engine = create_database_engine()
