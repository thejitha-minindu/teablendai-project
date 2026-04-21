"""
ChatMessage Domain Model (ORM)

Maps to: ChatMessages table in database
Purpose: Represents an individual message in a conversation
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from uuid import UUID, uuid4
import json
from typing import Optional, List, Dict, Any

from src.infrastructure.database.base import Base


class ChatMessage(Base):
    """
    ChatMessage entity - represents a single message
    """
    
    __tablename__ = "Messages"
    
    __table_args__ = (
        {'implicit_returning': False},
    )
    
    # Columns
    
    message_id = Column(
        "MessageID",
        UNIQUEIDENTIFIER,
        primary_key=True,
        default=uuid4,
        index=True
    )
    
    conversation_id = Column(
        "ConversationID",
        UNIQUEIDENTIFIER,
        ForeignKey("Conversations.ConversationID", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    role = Column(
        "Role",
        String(20),
        nullable=False
    )
    
    content = Column(
        "Content",
        Text,
        nullable=False
    )
    
    sql_query = Column(
        "SQLQuery",
        Text,
        nullable=True
    )
    
    data = Column(
        "DataJSON",
        Text,
        nullable=True
    )
    
    source = Column(
        "Source",
        String(50),
        nullable=True
    )
    
    visualization_type = Column(
        "VisualizationType",
        String(50),
        nullable=True
    )
    
    visualization_data = Column(
        "VisualizationData",
        Text,
        nullable=True
    )
    
    search_results = Column(
        "SearchResults",
        Text,
        nullable=True
    )
    
    timestamp = Column(
        "Timestamp",
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        server_default=func.getdate(),
        index=True
    )
    
    response_time_ms = Column(
        "ResponseTimeMs",
        Integer,
        nullable=True
    )
    
    # Relationships

    # Methods
    
    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"<ChatMessage("
            f"id={self.message_id}, "
            f"conversation={self.conversation_id}, "
            f"role='{self.role}', "
            f"content='{self.content[:30]}...'"
            f")>"
        )
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            "message_id": self.message_id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "sql_query": self.sql_query,
            "data": self.get_data(),
            "source": self.source,
            "visualization_type": self.visualization_type,
            "visualization": self.get_visualization_data(),
            "search_results": self.get_search_results(),
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "response_time_ms": self.response_time_ms,
        }
    
    # JSON Field Helpers
    
    def get_data(self) -> Optional[List[Dict]]:
        """Parse data JSON field"""
        if self.data:
            try:
                return json.loads(self.data)
            except json.JSONDecodeError:
                return None
        return None
    
    def set_data(self, data: List[Dict]) -> None:
        """Set data field as JSON string"""
        if data:
            self.data = json.dumps(data)
        else:
            self.data = None
    
    def get_visualization_data(self) -> Optional[Dict]:
        """Parse visualization JSON field"""
        if self.visualization_data:
            try:
                return json.loads(self.visualization_data)
            except json.JSONDecodeError:
                return None
        return None
    
    def set_visualization_data(self, viz_data: Dict) -> None:
        """Set visualization field as JSON string"""
        if viz_data:
            self.visualization_data = json.dumps(viz_data)
        else:
            self.visualization_data = None
    
    def get_search_results(self) -> Optional[List[Dict]]:
        """Parse search results JSON field"""
        if self.search_results:
            try:
                return json.loads(self.search_results)
            except json.JSONDecodeError:
                return None
        return None
    
    def set_search_results(self, results: List[Dict]) -> None:
        """Set search results as JSON string"""
        if results:
            self.search_results = json.dumps(results)
        else:
            self.search_results = None
    

    # Factory Methods
    @classmethod
    def create_user_message(
        cls,
        conversation_id: UUID,
        content: str
    ) -> "ChatMessage":
        """Factory method for user messages"""
        return cls(
            conversation_id=conversation_id,
            role="user",
            content=content,
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
        )
    
    @classmethod
    def create_assistant_message(
        cls,
        conversation_id: UUID,
        content: str,
        sql_query: str = None,
        data: List[Dict] = None,
        source: str = None,
        visualization_type: str = None,
        visualization_data: Dict = None,
        search_results: List[Dict] = None,
        response_time_ms: int = None,
        metadata: Dict = None
    ) -> "ChatMessage":
        """Factory method for assistant messages"""
        message = cls(
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            sql_query=sql_query,
            source=source,
            visualization_type=visualization_type,
            response_time_ms=response_time_ms,
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        
        # Set JSON fields using helpers
        if data:
            message.set_data(data)
        if visualization_data:
            message.set_visualization_data(visualization_data)
        if search_results:
            message.set_search_results(search_results)
        if metadata:
            setattr(message, "_metadata", metadata)
        
        return message