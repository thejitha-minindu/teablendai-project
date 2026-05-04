from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NotificationTypeEnum(str, enum.Enum):
    order = "order"
    system = "system"
    promo = "promo"
    alert = "alert"


# ── Admin: create a notification ─────────────────────────────────────────────

class NotificationCreate(BaseModel):
    """
    Used by the admin sendnotification page.
    Leave user_id as None to broadcast to all users.
    """
    user_id: Optional[uuid.UUID] = Field(
        None,
        description="Target user. Omit or set null to broadcast to everyone.",
    )
    target_role: Optional[str] = Field(
        None,
        description="Optional role to broadcast to, e.g., 'buyer' or 'seller'."
    )
    title: str = Field(..., max_length=255)
    message: str
    type: NotificationTypeEnum = NotificationTypeEnum.system


# ── User: read response ───────────────────────────────────────────────────────

class NotificationRead(BaseModel):
    notification_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    title: str
    message: str
    type: NotificationTypeEnum
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True