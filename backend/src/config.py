# Centralized config
import os
from typing import List, Optional
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
    API_V1_PREFIX: str = "/api/v1"

    # Application Info
    APP_NAME: str = "TeaBlendAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000"
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"] 

    # Database Configuration
    MSSQL_SERVER: str
    MSSQL_DATABASE: str
    MSSQL_USERNAME: Optional[str] = None
    MSSQL_PASSWORD: Optional[str] = None
    DB_TRUSTED_CONNECTION: bool = True

    CHAT_DATABASE_URL: bool = True

    # Database pool settings
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600

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

    # Chat settings
    MAX_CONVERSATION_HISTORY: int = 50
    CHAT_TIMEOUT_SECONDS: int = 30
    ENABLE_TOPIC_VALIDATION: bool = True

    # Valid Topics for Chat
    VALID_TOPICS: List[str] = [
        "tea",
        "auction",
        "grades",
        "pricing",
        "quality",
        "Ceylon tea",
        "tea types",
        "market trends",
        "bidding",
        "tea production",
        "tea blending",
        "tea tasting",
        "tea chemistry"
    ]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(levelname)s:%(name)s:%(message)s"

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'
        extra = "allow" 

# Singleton settings instance
_settings_instance = None

def get_settings() -> Settings:
    """Get settings instance (singleton pattern)"""
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance

# Create default instance for backward compatibility
settings = get_settings()

# Helper function to get database connection string
def get_mssql_connection_string(
    server: str = None,
    database: str = None,
    username: str = None,
    password: str = None,
    trusted: bool = True
) -> str:
    """
    Generate MSSQL connection string
    
    Args:
        server: SQL Server hostname
        database: Database name
        username: Username (for SQL auth)
        password: Password (for SQL auth)
        trusted: Use Windows authentication
        
    Returns:
        str: MSSQL connection string
    """
    settings = get_settings()
    
    server = server or settings.MSSQL_SERVER
    database = database or settings.MSSQL_DATABASE
    username = username or settings.MSSQL_USERNAME
    password = password or settings.MSSQL_PASSWORD
    trusted = trusted if trusted is not None else settings.DB_TRUSTED_CONNECTION
    
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
    
    return connection_string

__all__ = [
    'Settings',
    'get_settings',
    'settings',
    'get_mssql_connection_string',
    'BACKEND_DIR'
]