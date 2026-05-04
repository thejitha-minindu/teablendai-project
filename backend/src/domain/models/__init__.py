"""
Domain Models Package

Exports all ORM models and configures relationships
"""

from src.infrastructure.database.base import Base

# Import models first (ensures SQLAlchemy class registry is fully populated)
from .user import User, FinancialDetails, WatchList
from .auction import Auction
from .bid import Bid
from .order import Order, PaymentDetails, WinsAuction
from .conversation import Conversation
from .message import ChatMessage
from .outbox import AuctionOutbox
from .admin import Admin
from .violation import Violation
from .password_reset import PasswordReset

# Configure Relationships
from sqlalchemy.orm import relationship

# Add relationship to Conversation
Conversation.messages = relationship(
    "ChatMessage",
    back_populates="conversation",
    cascade="all, delete-orphan",
    lazy="select"
)

# Add relationship to ChatMessage
ChatMessage.conversation = relationship(
    "Conversation",
    back_populates="messages"
)

# Exports
__all__ = [
    "Base",
    "User",
    "FinancialDetails",
    "WatchList",
    "Auction",
    "Bid",
    "Order",
    "PaymentDetails",
    "WinsAuction",
    "Conversation",
    "ChatMessage",
    "PasswordReset",
]