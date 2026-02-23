"""
Conversation Domain Model (ORM)

Maps to: Conversations table in database
Purpose: Represents a chat conversation session
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from datetime import datetime

from src.infrastructure.database.base import Base

class Conversation(Base):
    """
    Conversation entity - represents a chat session
    """
    
    __tablename__ = "Conversations"

    # Columns
    conversation_id = Column(
        "ConversationID",
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True
    )
    
    title = Column(
        "Title",
        String(200),
        nullable=True
    )
    
    user_id = Column(
        "UserID",
        Integer,
        nullable=True,
        index=True
    )
    
    created_at = Column(
        "CreatedAt",
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.getdate()
    )
    
    updated_at = Column(
        "UpdatedAt",
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.getdate(),
        onupdate=datetime.utcnow
    )
    
    message_count = Column(
        "MessageCount",
        Integer,
        nullable=False,
        default=0
    )
    
    is_active = Column(
        "IsActive",
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
        index=True
    )
    
    # Relationships
    
    # Methods
    
    def __repr__(self) -> str:
        return (
            f"<Conversation("
            f"id={self.conversation_id}, "
            f"title='{self.title}', "
            f"messages={self.message_count}"
            f")>"
        )
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            "conversation_id": self.conversation_id,
            "title": self.title,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": self.message_count,
            "is_active": self.is_active,
        }
    
    def get_preview(self) -> str:
        """Get preview text from first message"""
        if hasattr(self, 'messages') and self.messages and len(self.messages) > 0:
            return self.messages[0].content[:100]
        return "New conversation"
    
    def get_messages_ordered(self):
        """Get messages ordered by timestamp"""
        if hasattr(self, 'messages'):
            return sorted(self.messages, key=lambda m: m.timestamp)
        return []
    
    @classmethod
    def create_new(cls, title: str = None, user_id: int = None) -> "Conversation":
        """Factory method to create a new conversation"""
        return cls(
            title=title or "New Conversation",
            user_id=user_id,
            message_count=0,
            is_active=True
        )