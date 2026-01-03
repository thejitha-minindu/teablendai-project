"""
Domain Models Package

Exports all ORM models and configures relationships
"""

from src.infrastructure.database.base import Base

# Import models first
from .conversation import Conversation
from .message import ChatMessage

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
    "Conversation",
    "ChatMessage",
]