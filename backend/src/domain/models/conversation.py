"""
Conversation domain model - SQLAlchemy ORM only.
NO imports from application or services layers.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import UUID, uuid4
from src.infrastructure.database.base import Base


class Conversation(Base):
    __tablename__ = "Conversations"

    conversation_id = Column("ConversationID", UNIQUEIDENTIFIER, primary_key=True, default=uuid4)
    title           = Column("Title", String(500), nullable=True)
    user_id         = Column("UserID", UNIQUEIDENTIFIER, nullable=True)
    created_at      = Column("CreatedAt", DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at      = Column("UpdatedAt", DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    message_count   = Column("MessageCount", Integer, default=0)
    is_active       = Column("IsActive", Boolean, default=True)
    is_pinned       = Column("IsPinned", Boolean, default=False)
    pinned_at       = Column("PinnedAt", DateTime, nullable=True)

    @classmethod
    def create_new(cls, title: str = None, user_id: UUID = None) -> "Conversation":
        """Factory method to create a new Conversation instance"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        return cls(
            title=title or f"Conversation - {now.strftime('%Y-%m-%d %H:%M')}",
            user_id=user_id,
            created_at=now,
            updated_at=now,
            message_count=0,
            is_active=True,
            is_pinned=False,
            pinned_at=None,
        )

    def pin(self) -> None:
        """Pin this conversation and record when it was pinned."""
        self.is_pinned = True
        self.pinned_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def unpin(self) -> None:
        """Unpin this conversation and clear pin timestamp."""
        self.is_pinned = False
        self.pinned_at = None

    def to_dict(self) -> dict:
        def safe_dt(v):
            if v is None: return None
            if hasattr(v, "isoformat"):
                if getattr(v, "tzinfo", None) is None:
                    v = v.replace(tzinfo=timezone.utc)
                else:
                    v = v.astimezone(timezone.utc)
                return v.isoformat()
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
            "is_pinned":       self.is_pinned,
            "pinned_at":       safe_dt(self.pinned_at),
        }