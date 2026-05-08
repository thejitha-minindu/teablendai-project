from sqlalchemy import Column, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from src.infrastructure.database.base import Base

class OrderMessage(Base):
    __tablename__ = "order_messages"

    message_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    order_id = Column(UNIQUEIDENTIFIER, ForeignKey("orders.order_id"), nullable=False, index=True)
    sender_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order")
    sender = relationship("User")
