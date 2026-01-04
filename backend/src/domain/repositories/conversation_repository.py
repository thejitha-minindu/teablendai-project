from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

from src.domain.models.conversation import Conversation

class ConversationRepositoryInterface(ABC):
    """
    Repository interface for Conversation entity
    
    All methods are abstract - they MUST be implemented by concrete classes.
    This interface defines the contract for conversation data access.
    """

    # QUERY METHODS

    @abstractmethod
    def get_by_id(self, conversation_id: int) -> Optional[Conversation]:
        pass

    @abstractmethod
    def get_all(
        self, 
        limit: int = 50, 
        offset: int = 0, 
        user_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[Conversation]:
        """Retrieve all conversations with pagination and filtering"""
        pass

    @abstractmethod
    def get_recent(
        self, 
        limit: int = 10,
        user_id: Optional[int] = None
    ) -> List[Conversation]:
        """Retrieve recent conversations"""
        pass

    @abstractmethod
    def count_all(
        self,
        user_id: Optional[int] = None,
        active_only: bool = True
    ) -> int:
        """Count all conversations with optional filtering"""
        pass

    @abstractmethod
    def exists(
        self, 
        conversation_id: int
    ) -> bool:
        """Check if a conversation exists by ID"""
        pass
    

    # COMMAND METHODS

    @abstractmethod
    def create(
        self, 
        conversation: Conversation
    ) -> Conversation:
        """Create a new conversation"""
        pass

    @abstractmethod
    def update(
        self, 
        conversation: Conversation
    ) -> Conversation:
        """Update an existing conversation"""
        pass

    @abstractmethod
    def delete(
        self, 
        conversation_id: int
    ) -> bool:
        """Delete an existing conversation"""
        pass
    

    @abstractmethod
    def soft_delete(
        self, 
        conversation_id: int
    ) -> bool:
        """Soft delete a conversation (set is_active = False)"""
        pass

    @abstractmethod
    def restore(
        self, 
        conversation_id: int
    ) -> bool:
        """Restore a soft-deleted conversation (set is_active = True)"""
        pass

    
    # BATCH OPERATIONS

    @abstractmethod
    def delete_old_conversations(
        self,
        older_than_days: int,
        user_id: Optional[int] = None
    ) -> int:
        """Delete conversations older than a certain number of days"""
        pass

    # SEARCH & ADVANCED QUERIES

    @abstractmethod
    def search_by_title(
        self,
        search_term: str,
        limit: int = 20
    ) -> List[Conversation]:
        """Search conversations by a title"""
        pass

    @abstractmethod
    def get_with_messages(
        self,
        conversation_id: int,
    ) -> Optional[Conversation]:
        """Get conversation with all messages eagerly loaded"""
        pass

__all__ = [
    "ConversationRepositoryInterface",
]