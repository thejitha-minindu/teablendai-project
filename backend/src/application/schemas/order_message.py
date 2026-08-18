from pydantic import BaseModel, ConfigDict, field_serializer
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional

class OrderMessageBase(BaseModel):
    content: str

class OrderMessageCreate(OrderMessageBase):
    pass

class OrderMessageResponse(OrderMessageBase):
    message_id: UUID
    order_id: UUID
    sender_id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("timestamp")
    def serialize_timestamp(self, dt: datetime, _info):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")
