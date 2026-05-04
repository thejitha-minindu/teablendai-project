from pydantic import BaseModel, ConfigDict
from datetime import datetime
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
