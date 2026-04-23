# Centralized config
import os
import logging
from typing import List, Optional
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

# Setup logging early
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the backend directory path
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Explicitly load .env from backend root
load_dotenv(dotenv_path=BACKEND_DIR / ".env")

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def resolve_model_name(raw_model_name: Optional[str]) -> str:
    """Normalize model names from env and apply safe fallback."""
    if not raw_model_name:
        return DEFAULT_GEMINI_MODEL

    normalized = str(raw_model_name).strip().strip('"').strip("'").strip().rstrip(",")

    if not normalized:
        return DEFAULT_GEMINI_MODEL

    return normalized


class Settings(BaseSettings):
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Application Info
    APP_NAME: str = "TeaBlendAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    MODEL_NAME: str = DEFAULT_GEMINI_MODEL
    GOOGLE_API_KEY: Optional[str] = None

    TAVILY_API_KEY: Optional[str] = None
    AUCTION_API_BASE_URL: Optional[str] = None

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
    MSSQL_SERVER: str = ""
    MSSQL_DATABASE: str = ""
    MSSQL_USERNAME: Optional[str] = None
    MSSQL_PASSWORD: Optional[str] = None
    MSSQL_PORT: Optional[int] = None
    MSSQL_DRIVER: str = "ODBC Driver 18 for SQL Server"
    MSSQL_ENCRYPT: bool = True
    MSSQL_TRUST_SERVER_CERTIFICATE: bool = False
    DB_TRUSTED_CONNECTION: bool = True
    DATABASE_URL: Optional[str] = None
    INIT_DB_ON_STARTUP: bool = False

    CHAT_DATABASE_URL: Optional[str] = None

    # Database pool settings
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600

    # Chat settings
    MAX_CONVERSATION_HISTORY: int = 50
    CHAT_TIMEOUT_SECONDS: int = 30
    ENABLE_TOPIC_VALIDATION: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(levelname)s:%(name)s:%(message)s"

    # Authentication & Security
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Email Configuration (SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # Password Reset Configuration
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3

    # Analytics settings
    ANALYTICS_SCHEDULER_ENABLED: bool = True
    ANALYTICS_SNAPSHOT_INTERVAL_SECONDS: int = 30
    ANALYTICS_SNAPSHOT_RETENTION_DAYS: int = 90
    ANALYTICS_KPI_LOOKBACK_DAYS: int = 30
    ANALYTICS_CHART_MONTHS: int = 6

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"


# Singleton settings instance
_settings_instance: Optional[Settings] = None


def get_settings() -> Settings:
    """Get settings instance (singleton pattern)"""
    global _settings_instance

    if _settings_instance is None:
        _settings_instance = Settings()

        # Normalize MODEL_NAME after loading from env
        _settings_instance.MODEL_NAME = resolve_model_name(
            _settings_instance.MODEL_NAME
        )

        logger.info("Using AI model: %s", _settings_instance.MODEL_NAME)

    return _settings_instance


# Create default instance for backward compatibility
settings = get_settings()


def get_mssql_connection_string(
    server: str = None,
    database: str = None,
    username: str = None,
    password: str = None,
    trusted: Optional[bool] = None,
    driver: str = None,
    encrypt: Optional[bool] = None,
    trust_server_certificate: Optional[bool] = None,
    database_url: str = None,
) -> str:
    """Generate MSSQL connection string"""

    # Direct parameter
    direct_connection = (database_url or "").strip()
    if direct_connection:
        return direct_connection

    settings = get_settings()

    # Env DATABASE_URL
    if settings.DATABASE_URL:
        return settings.DATABASE_URL.strip()

    server = server or settings.MSSQL_SERVER
    database = database or settings.MSSQL_DATABASE
    username = username or settings.MSSQL_USERNAME
    password = password or settings.MSSQL_PASSWORD
    trusted = settings.DB_TRUSTED_CONNECTION if trusted is None else trusted
    driver = driver or settings.MSSQL_DRIVER
    encrypt = settings.MSSQL_ENCRYPT if encrypt is None else encrypt
    trust_server_certificate = (
        settings.MSSQL_TRUST_SERVER_CERTIFICATE
        if trust_server_certificate is None
        else trust_server_certificate
    )

    if settings.MSSQL_PORT and server and "," not in server and ":" not in server:
        server = f"{server},{settings.MSSQL_PORT}"

    params = [
        f"driver={quote_plus(driver)}",
        f"Encrypt={'yes' if encrypt else 'no'}",
        f"TrustServerCertificate={'yes' if trust_server_certificate else 'no'}",
    ]

    if trusted or (not username and not password):
        params.append("trusted_connection=yes")
        return f"mssql+pyodbc://{server}/{database}?{'&'.join(params)}"

    encoded_username = quote_plus(username or "")
    encoded_password = quote_plus(password or "")

    return (
        f"mssql+pyodbc://{encoded_username}:{encoded_password}@{server}/{database}"
        f"?{'&'.join(params)}"
    )


__all__ = [
    "Settings",
    "get_settings",
    "resolve_model_name",
    "settings",
    "get_mssql_connection_string",
    "BACKEND_DIR",
    "DEFAULT_GEMINI_MODEL",
]