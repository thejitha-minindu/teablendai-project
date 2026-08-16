from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from datetime import datetime
from src.infrastructure.database.base import Base


class PasswordReset(Base):
    """
    Temporary storage for password reset OTPs.
    OTP expires after 5 minutes and allows max 3 verification attempts.
    """
    __tablename__ = "password_resets"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)  # 6-digit OTP
    attempts = Column(Integer, default=0, nullable=False)  # Number of verification attempts
    max_attempts = Column(Integer, default=3, nullable=False)  # Max allowed attempts
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # OTP expiry time (5 minutes from creation)
    is_used = Column(Boolean, default=False, nullable=False)  # Mark as used after successful reset

    user = relationship("User", back_populates="password_resets")
