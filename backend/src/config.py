# Centralized config
import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent

class Settings(BaseSettings):
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 5000
    API_RELOAD: bool = True

    # CORS Configuration
    CORS_ORIGINS: List[str] = []  

    # Database Configuration
    MSSQL_SERVER: str
    MSSQL_DATABASE: str
    DB_TRUSTED_CONNECTION: bool = True

    # MCP Servers - Use relative paths from backend directory
    MCP_DATABASE_SERVER_PATH: str = str(
        BACKEND_DIR / "mcp_servers" / "tea_database" / "server.py"
    )
    MCP_SEARCH_SERVER_PATH: str = str(
        BACKEND_DIR / "mcp_servers" / "tea_search" / "server.py"
    )
    MCP_VISUALIZATION_SERVER_PATH: str = str(
        BACKEND_DIR / "mcp_servers" / "tea_visualization" / "server.py"
    )

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

