import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.domain.models.order import Order
from src.domain.models.user import User
from src.infrastructure.repositories.order_message_repository import OrderMessageRepository

logger = logging.getLogger(__name__)

class OrderMessageService:
    def __init__(self, db: Session):
        self.db = db
        self.message_repo = OrderMessageRepository(db)

    def _verify_access(self, order_id: str, user_id: str) -> Order:
        """
        Verify that the order exists and the user has permission to access it.
        A user has permission if they are the buyer (order.user_id) 
        or the seller (order.auction.seller_id).
        """
        order = self.db.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # The user is either the buyer...
        if str(order.user_id) == str(user_id):
            return order

        # ...or the seller
        if order.auction and str(order.auction.seller_id) == str(user_id):
            return order

        raise HTTPException(status_code=403, detail="Not authorized to access messages for this order")

    def get_messages(self, order_id: str, current_user: User):
        # Verify access
        self._verify_access(order_id, str(current_user.user_id))
        
        # Fetch messages
        return self.message_repo.get_messages_by_order(order_id)

    def create_message(self, order_id: str, sender_id: str, content: str):
        # Verify access
        self._verify_access(order_id, sender_id)
        
        # Create message
        return self.message_repo.create_message(order_id, sender_id, content)
