"""
ChatMessage Repository Interface
Contract for chat message data access operations.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

from src.domain.models.message import ChatMessage

class ChatMessageRepositoryInterface(ABC):
    """
    Repository interface for ChatMessage entity
    
    Defines the contract for message data access operations.
    All methods must be implemented by concrete repository classes.
    """

    # QUERY METHODS

    @abstractmethod
    def get_by_id(self, message_id: UUID) -> Optional[ChatMessage]:
        """Retrieve a chat message by its ID"""
        pass

    @abstractmethod
    def get_by_conversation(
        self,
        conversation_id: UUID,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ChatMessage]:
        """Retrieve all messages in a conversation"""
        pass

    @abstractmethod
    def get_recent_by_conversation(
        self,
        conversation_id: UUID,
        limit: int = 10
    ) -> List[ChatMessage]:
        """Get the most recent messages in a conversation"""
        pass

    @abstractmethod
    def count_by_conversation(
        self,
        conversation_id: UUID
    ) -> int:
        """Count total messages in a conversation"""
        pass

    @abstractmethod
    def get_user_messages(
        self,
        conversation_id: UUID
    ) -> List[ChatMessage]:
        """Retrieve all user messages in a conversation"""
        pass

    @abstractmethod
    def get_assistant_messages(
        self,
        conversation_id: UUID
    ) -> List[ChatMessage]:
        """Retrieve all assistant messages in a conversation"""
        pass
    
    # COMMAND METHODS

    @abstractmethod
    def create(
        self,
        message: ChatMessage
    ) -> ChatMessage:
        """Create a new message in the database"""
        pass

    @abstractmethod
    def create_many(
        self,
        messages: List[ChatMessage]
    ) -> List[ChatMessage]:
        """Create multiple messages in the database"""
        pass

    @abstractmethod
    def update(self, message: ChatMessage) -> ChatMessage:
        """
        Update an existing message in the database
        """
        pass

    @abstractmethod
    def delete(self, message_id: UUID) -> bool:
        """
        Delete a message permanently from the database
        """
        pass

    @abstractmethod
    def delete_by_conversation(self, conversation_id: UUID) -> int:
        """
        Delete all messages in a conversation
        """
        pass

    # SEARCH & ANALYTICS

    @abstractmethod
    def search_content(
        self,
        search_term: str,
        conversation_id: Optional[UUID] = None,
        limit: int = 20
    ) -> List[ChatMessage]:
        """
        Search message content
        """
        pass

    @abstractmethod
    def get_messages_with_sql(
        self,
        conversation_id: Optional[UUID] = None
    ) -> List[ChatMessage]:
        """
        Get messages that contain SQL queries
        """
        pass

    @abstractmethod
    def get_messages_by_source(
        self,
        source: str,
        conversation_id: Optional[UUID] = None,
        limit: int = 100
    ) -> List[ChatMessage]:
        """
        Get messages filtered by source
        """
        pass

    @abstractmethod
    def get_average_response_time(
        self,
        conversation_id: Optional[UUID] = None
    ) -> float:
        """
        Calculate average response time for assistant messages
        """
        pass

    @abstractmethod
    def get_messages_with_visualizations(
        self,
        conversation_id: Optional[UUID] = None
    ) -> List[ChatMessage]:
        """
        Get messages that contain visualizations
        """
        pass

    @abstractmethod
    def get_statistics(
        self,
        conversation_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive statistics about messages
        """
        pass

__all__ = [
    "ChatMessageRepositoryInterface",
]