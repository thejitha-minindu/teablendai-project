from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from datetime import datetime
from src.infrastructure.database.base import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    log_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    display_id = Column(String(16), unique=True, nullable=False)
    user_name = Column(String(128), nullable=False)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=True, index=True)
    activity_type = Column(String(64), nullable=False, index=True)
    status = Column(String(16), nullable=False, default="success", index=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
