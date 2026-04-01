"""
Conversation Repository Implementation

SQLAlchemy-based implementation of ConversationRepositoryInterface.
This class contains the actual database operations using SQLAlchemy ORM.
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, func, and_, case

from src.domain.models.conversation import Conversation
from src.domain.repositories.conversation_repository import ConversationRepositoryInterface
import logging

logger = logging.getLogger(__name__)

class ConversationRepository(ConversationRepositoryInterface):
    """
    SQLAlchemy implementation of Conversation repository
    
    This class provides concrete implementations of all conversation
    data access operations using SQLAlchemy ORM.
    """

    def __init__(self, db: Session):
        self.db = db
        
    # QUERY METHODS

    def get_by_id(self, conversation_id: UUID) -> Optional[Conversation]:
        """Retrieve a conversation by its unique ID"""
        try:
            conversation = self.db.query(Conversation).filter(
                Conversation.conversation_id == conversation_id
            ).first()

            if conversation:
                logger.debug(f"Found conversation {conversation_id}: {conversation.title}")
            else:
                logger.debug(f"Conversation {conversation_id} not found")
            
            return conversation
        except Exception as e:
            logger.error(f"Error getting conversation {conversation_id}: {e}")
            return None
        
    def get_all(
        self, 
        limit: int = 50, 
        offset: int = 0,
        user_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[Conversation]:
        """Retrieve all conversations with pagination and filtering"""
        try:
            query = self.db.query(Conversation)
            
            if user_id is not None:
                query = query.filter(Conversation.user_id == user_id)
            
            if active_only:
                query = query.filter(Conversation.is_active == True)

            # Keep pinned conversations at the top. Pinned items are ordered by pin time,
            # and unpinned items are ordered by last update time.
            sort_ts = case(
                (Conversation.is_pinned == True, Conversation.pinned_at),
                else_=Conversation.updated_at,
            )

            query = query.order_by(
                desc(Conversation.is_pinned),
                desc(sort_ts),
                desc(Conversation.updated_at),
            )
            conversations = query.limit(limit).offset(offset).all()
            logger.debug(
                f"Retrieved {len(conversations)} conversations "
                f"(limit={limit}, offset={offset}, user_id={user_id})"
            )
            
            return conversations
        except Exception as e:
            logger.error(f"Error getting all conversations: {e}")
            return []
        
    def get_recent(
        self, 
        limit: int = 10,
        user_id: Optional[int] = None
    ) -> List[Conversation]:
        """Retrieve the most recently updated conversations"""

        try:
            query = self.db.query(Conversation).filter(
                Conversation.is_active == True
            )

            if user_id is not None:
                query = query.filter(Conversation.user_id == user_id)
            
            conversations = query.order_by(
                desc(Conversation.updated_at)
            ).limit(limit).all()
            
            logger.debug(f"Retrieved {len(conversations)} recent conversations")
            
            return conversations
        except Exception as e:
            logger.error(f"Error getting recent conversations: {e}")
            return []

    def count_all(
        self,
        user_id: Optional[int] = None,
        active_only: bool = True
    ) -> int:
        """Count total number of conversations"""

        try:
            query = self.db.query(func.count(Conversation.conversation_id))
            
            if active_only:
                query = query.filter(Conversation.is_active == True)
            
            if user_id is not None:
                query = query.filter(Conversation.user_id == user_id)
            
            count = query.scalar()
            
            logger.debug(f"Total conversations: {count}")
            
            return count or 0
        
        except Exception as e:
            logger.error(f"Error counting conversations: {e}")
            return 0
        
    def exists(self, conversation_id: UUID) -> bool:
        """Check if a conversation exists"""

        try:
            exists = self.db.query(
                self.db.query(Conversation).filter(
                    Conversation.conversation_id == conversation_id
                ).exists()
            ).scalar()
            
            return bool(exists)
        
        except Exception as e:
            logger.error(f"Error checking conversation existence: {e}")
            return False
        
    # COMMAND METHODS

    def create(self, conversation: Conversation) -> Conversation:
        """Create a new conversation"""
        try:
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            
            logger.info(
                f"Created conversation {conversation.conversation_id}: "
                f"{conversation.title}"
            )
            
            return conversation
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating conversation: {e}")
            raise

    def update(self, conversation: Conversation) -> Conversation:
        """Update an existing conversation"""
        try:
            merged = self.db.merge(conversation)
            merged.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.db.commit()
            self.db.refresh(merged)
            logger.info(f"Updated conversation {merged.conversation_id}")
            return merged
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating conversation: {e}")
            raise

    def delete(self, conversation_id: UUID) -> bool:
        """Permanently delete a conversation"""
        try:
            conversation = self.get_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Cannot delete - conversation {conversation_id} not found")
                return False
            
            self.db.delete(conversation)
            self.db.commit()

            logger.info(f"Deleted conversation {conversation_id} (hard delete)")
            
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id}: {e}")
            self.db.rollback()
            return False
        
    def soft_delete(self, conversation_id: UUID) -> bool:
        """Soft delete a conversation (set is_active = False)"""
        try:
            conversation = self.get_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Cannot soft delete - conversation {conversation_id} not found")
                return False
            
            conversation.is_active = False
            conversation.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            self.db.commit()

            logger.info(f"Soft deleted conversation {conversation_id}")
            
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id}: {e}")
            self.db.rollback()
            return False
        
    def restore(self, conversation_id: UUID) -> bool:
        """Restore a soft-deleted conversation"""
        try:
            conversation = self.db.query(Conversation).filter(
                Conversation.conversation_id == conversation_id
            ).first()
            
            if not conversation:
                logger.warning(f"Cannot restore - conversation {conversation_id} not found")
                return False
            
            conversation.is_active = True
            conversation.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
  
            self.db.commit()
            
            logger.info(f"Restored conversation {conversation_id}")
            
            return True
        except Exception as e:
            logger.error(f"Error restoring conversation {conversation_id}: {e}")
            self.db.rollback()
            return False
        
    # BATCH OPERATIONS

    def delete_old_conversations(
        self,
        older_than_days: int,
        user_id: Optional[int] = None
    ) -> int:
        """Delete conversations older than specified days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)

            query = self.db.query(Conversation).filter(
                Conversation.created_at < cutoff_date
            )
            
            if user_id is not None:
                query = query.filter(Conversation.user_id == user_id)
            
            count = query.count()
            
            query.delete(synchronize_session=False)
            self.db.commit()
            
            logger.info(
                f"Deleted {count} conversations older than {older_than_days} days"
            )
            return count
        except Exception as e:
            logger.error(f"Error deleting old conversations: {e}")
            self.db.rollback()
            return 0
        
    # SEARCH & ADVANCED QUERIES

    def search_by_title(
        self,
        search_term: str,
        limit: int = 20
    ) -> List[Conversation]:
        """Search conversations by title"""
        try:
            pattern = f"%{search_term}%"
            conversations = self.db.query(Conversation).filter(
                Conversation.title.ilike(pattern),
                Conversation.is_active == True
            ).order_by(desc(Conversation.updated_at)).limit(limit).all()
            
            logger.debug(
                f"Found {len(conversations)} conversations matching '{search_term}'"
            )
            return conversations
        except Exception as e:
            logger.error(f"Error searching conversations by title: {e}")
            return []
        
    def get_with_messages(
        self,
        conversation_id: UUID
    ) -> Optional[Conversation]:
        """Get conversation with all messages eagerly loaded"""
        try:
            conversation = self.db.query(Conversation).options(
                joinedload(Conversation.messages)
            ).filter(
                Conversation.conversation_id == conversation_id
            ).first()
            
            if conversation:
                logger.debug(
                    f"Loaded conversation {conversation_id} with "
                    f"{len(conversation.messages)} messages"
                )
            
            return conversation
        except Exception as e:
            logger.error(
                f"Error getting conversation {conversation_id} with messages: {e}"
            )
            return None

    def pin(self, conversation_id: int) -> bool:
        """Pin a conversation and record pin timestamp."""
        try:
            conversation = self.get_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Cannot pin - conversation {conversation_id} not found")
                return False

            conversation.pin()
            conversation.updated_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Pinned conversation {conversation_id}")
            return True
        except Exception as e:
            logger.error(f"Error pinning conversation {conversation_id}: {e}")
            self.db.rollback()
            return False

    def unpin(self, conversation_id: int) -> bool:
        """Unpin a conversation and clear pin timestamp."""
        try:
            conversation = self.get_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Cannot unpin - conversation {conversation_id} not found")
                return False

            conversation.unpin()
            conversation.updated_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Unpinned conversation {conversation_id}")
            return True
        except Exception as e:
            logger.error(f"Error unpinning conversation {conversation_id}: {e}")
            self.db.rollback()
            return False
        
# HELPER FUNCTIONS
def get_conversation_repository(db: Session) -> ConversationRepository:
    return ConversationRepository(db)