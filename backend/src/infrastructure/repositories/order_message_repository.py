from sqlalchemy.orm import Session
from src.domain.models.order_message import OrderMessage
from typing import List

class OrderMessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_messages_by_order(self, order_id: str) -> List[OrderMessage]:
        return (
            self.db.query(OrderMessage)
            .filter(OrderMessage.order_id == order_id)
            .order_by(OrderMessage.timestamp.asc())
            .all()
        )

    def create_message(self, order_id: str, sender_id: str, content: str) -> OrderMessage:
        message = OrderMessage(
            order_id=order_id,
            sender_id=sender_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
