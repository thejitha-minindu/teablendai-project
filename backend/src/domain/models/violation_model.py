import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func

from src.database import Base


class ViolationTypeEnum(str, enum.Enum):
    fraud = "Fraud"
    scam = "Scam"
    harassment = "Harassment"
    fake_product = "Fake Product"
    payment_issue = "Payment Issue"
    other = "Other"


class ViolationStatusEnum(str, enum.Enum):
    open = "Open"
    under_review = "Under Review"
    resolved = "Resolved"
    closed = "Closed"


class Violation(Base):
    """
    Maps directly to dbo.violations.
    auction_id column must be added via migration (see alembic file).
    """
    __tablename__ = "violations"

    violation_id = Column(
        UNIQUEIDENTIFIER,
        primary_key=True,
        default=uuid.uuid4,
    )
    sender_id = Column(
        UNIQUEIDENTIFIER,
        ForeignKey("users.user_id"),
        nullable=False,
    )
    violator_id = Column(String(255), nullable=False)
    auction_id = Column(String(255), nullable=True)        # added via migration
    violation_type = Column(Enum(ViolationTypeEnum), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(
        Enum(ViolationStatusEnum),
        nullable=False,
        default=ViolationStatusEnum.open,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )