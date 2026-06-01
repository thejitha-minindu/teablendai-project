from __future__ import annotations

import uuid
import enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field



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


class ViolationCreate(BaseModel):
    violator_id: str = Field(..., description="User ID or identifier of the reported party")
    auction_id: Optional[str] = Field(None)
    violation_type: ViolationTypeEnum
    reason: str = Field(..., min_length=5)


class ViolationRead(BaseModel):
    violation_id: uuid.UUID
    sender_id: uuid.UUID
    violator_id: str
    auction_id: Optional[str]
    violation_type: ViolationTypeEnum
    reason: str
    status: ViolationStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


class AdminViolationStatusUpdate(BaseModel):
    status: ViolationStatusEnum


class AdminViolationRead(ViolationRead):
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
