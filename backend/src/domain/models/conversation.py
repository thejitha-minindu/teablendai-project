"""
Conversation domain model - SQLAlchemy ORM only.
NO imports from application or services layers.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from src.infrastructure.database.base import Base


class Conversation(Base):
    __tablename__ = "Conversations"

    conversation_id = Column("ConversationID", Integer, primary_key=True, autoincrement=True)
    title           = Column("Title", String(500), nullable=True)
    user_id         = Column("UserID", Integer, nullable=True)
    created_at      = Column("CreatedAt", DateTime, default=datetime.utcnow)
    updated_at      = Column("UpdatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    message_count   = Column("MessageCount", Integer, default=0)
    is_active       = Column("IsActive", Boolean, default=True)

    @classmethod
    def create_new(cls, title: str = None, user_id: int = None) -> "Conversation":
        """Factory method to create a new Conversation instance"""
        return cls(
            title=title or f"Conversation - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            message_count=0,
            is_active=True,
        )

    def to_dict(self) -> dict:
        def safe_dt(v):
            if v is None: return None
            if hasattr(v, "isoformat"): return v.isoformat()
            if isinstance(v, (int, float)):
                return datetime.fromtimestamp(v / 1000 if v > 1e10 else v).isoformat()
            return str(v)

        return {
            "conversation_id": self.conversation_id,
            "title":           self.title,
            "user_id":         self.user_id,
            "created_at":      safe_dt(self.created_at),
            "updated_at":      safe_dt(self.updated_at),
            "message_count":   self.message_count,
            "is_active":       self.is_active,
        }