import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func

from src.database import Base


class NotificationTypeEnum(str, enum.Enum):
    order = "order"
    system = "system"
    promo = "promo"
    alert = "alert"


class Notification(Base):
    """
    Stores notifications sent by admins to individual users or broadcast to all.
    Created via the admin/sendnotification page.
    Users can read and mark as read from their profile page.
    """
    __tablename__ = "notifications"

    notification_id = Column(
        UNIQUEIDENTIFIER,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id = Column(
        UNIQUEIDENTIFIER,
        ForeignKey("users.user_id"),
        nullable=True,           # NULL = broadcast to all users
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(
        Enum(NotificationTypeEnum),
        nullable=False,
        default=NotificationTypeEnum.system,
    )
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )