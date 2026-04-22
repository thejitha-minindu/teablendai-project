"""
ChatMessage Repository Implementation

SQLAlchemy-based implementation of ChatMessageRepositoryInterface.

"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, and_, or_

from src.domain.models.message import ChatMessage
from src.domain.repositories.chatbot.chat_repository import ChatMessageRepositoryInterface
import logging

logger = logging.getLogger(__name__)

class ChatMessageRepository(ChatMessageRepositoryInterface):
    """SQLAlchemy implementation of ChatMessage repository"""
    
    def __init__(self, db: Session):
        """Initialize repository with database session"""
        self.db = db
    
    # QUERY METHODS
    
    def get_by_id(self, message_id: UUID) -> Optional[ChatMessage]:
        """Retrieve a message by its unique ID"""
        try:
            message = self.db.query(ChatMessage).filter(
                ChatMessage.message_id == message_id
            ).first()
            
            if message:
                logger.debug(f"Found message {message_id}")
            
            return message
        except Exception as e:
            logger.error(f"Error getting message {message_id}: {e}")
            return None
    
    def get_by_conversation(
        self,
        conversation_id: UUID,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ChatMessage]:
        """Retrieve all messages in a conversation"""
        try:
            query = self.db.query(ChatMessage).filter(
                ChatMessage.conversation_id == conversation_id
            ).order_by(
                asc(ChatMessage.timestamp)
            )
            
            if limit is not None:
                query = query.limit(limit).offset(offset)
            
            messages = query.all()
            
            logger.debug(
                f"Retrieved {len(messages)} messages from conversation {conversation_id}"
            )
            return messages
        except Exception as e:
            logger.error(
                f"Error getting messages for conversation {conversation_id}: {e}"
            )
            return []
    
    def get_recent_by_conversation(
        self,
        conversation_id: UUID,
        limit: int = 10
    ) -> List[ChatMessage]:
        """Get the most recent messages in a conversation"""
        try:
            messages = self.db.query(ChatMessage).filter(
                ChatMessage.conversation_id == conversation_id
            ).order_by(
                desc(ChatMessage.timestamp)
            ).limit(limit).all()
            
            logger.debug(
                f"Retrieved {len(messages)} recent messages from conversation {conversation_id}"
            )
            
            return messages
        except Exception as e:
            logger.error(f"Error getting recent messages: {e}")
            return []
    
    def count_by_conversation(self, conversation_id: UUID) -> int:
        """Count total messages in a conversation""" 
        try:
            count = self.db.query(func.count(ChatMessage.message_id)).filter(
                ChatMessage.conversation_id == conversation_id
            ).scalar()
            
            return count or 0
        except Exception as e:
            logger.error(f"Error counting messages: {e}")
            return 0
    
    def get_user_messages(
        self,
        conversation_id: UUID
    ) -> List[ChatMessage]:
        """Get all user messages in a conversation"""
        try:
            messages = self.db.query(ChatMessage).filter(
                and_(
                    ChatMessage.conversation_id == conversation_id,
                    ChatMessage.role == 'user'
                )
            ).order_by(
                asc(ChatMessage.timestamp)
            ).all()
            
            logger.debug(
                f"Retrieved {len(messages)} user messages from conversation {conversation_id}"
            )
            
            return messages
        except Exception as e:
            logger.error(f"Error getting user messages: {e}")
            return []
    
    def get_assistant_messages(
        self,
        conversation_id: UUID
    ) -> List[ChatMessage]:
        """Get all assistant messages in a conversation"""
        try:
            messages = self.db.query(ChatMessage).filter(
                and_(
                    ChatMessage.conversation_id == conversation_id,
                    ChatMessage.role == 'assistant'
                )
            ).order_by(
                asc(ChatMessage.timestamp)
            ).all()
            
            logger.debug(
                f"Retrieved {len(messages)} assistant messages from conversation {conversation_id}"
            )
            return messages
        except Exception as e:
            logger.error(f"Error getting assistant messages: {e}")
            return []

    # COMMAND METHODS
    
    def create(self, message: ChatMessage) -> ChatMessage:
        """Create a new message in the database"""
        try:
            self.db.add(message)
            self.db.flush()
            self.db.commit()
            self.db.refresh(message)
            
            logger.info(
                f"Created message {message.message_id} "
                f"[{message.role}] in conversation {message.conversation_id}"
            )
            return message
        except Exception as e:
            logger.error(f"Error creating message: {e}")
            self.db.rollback()
            raise
    
    def create_many(
        self,
        messages: List[ChatMessage]
    ) -> List[ChatMessage]:
        """Create multiple messages at once (bulk insert)"""
        try:
            self.db.add_all(messages)
            self.db.commit()
            for msg in messages:
                self.db.refresh(msg)
            
            logger.info(f"Created {len(messages)} messages in bulk")
            return messages
        except Exception as e:
            logger.error(f"Error creating messages in bulk: {e}")
            self.db.rollback()
            raise
    
    def update(self, message: ChatMessage) -> ChatMessage:
        """Update an existing message"""
        try:
            merged = self.db.merge(message)
            self.db.commit()
            self.db.refresh(merged)
            logger.info(f"Updated message {merged.message_id}")
            return merged
        except Exception as e:
            logger.error(f"Error updating message: {e}")
            self.db.rollback()
            raise
    
    def delete(self, message_id: UUID) -> bool:
        """Delete a message permanently"""
        try:
            message = self.get_by_id(message_id)
            
            if not message:
                logger.warning(f"Cannot delete - message {message_id} not found")
                return False
            self.db.delete(message)
            self.db.commit()
            logger.info(f"Deleted message {message_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting message {message_id}: {e}")
            self.db.rollback()
            return False
    
    def delete_by_conversation(self, conversation_id: UUID) -> int:
        """Delete all messages in a conversation"""
        try:
            count = self.count_by_conversation(conversation_id)
            self.db.query(ChatMessage).filter(
                ChatMessage.conversation_id == conversation_id
            ).delete(synchronize_session=False)
            
            self.db.commit()
            
            logger.info(f"Deleted {count} messages from conversation {conversation_id}")
            return count
        except Exception as e:
            logger.error(f"Error deleting messages: {e}")
            self.db.rollback()
            return 0
    
    # SEARCH & ANALYTICS
    def search_content(
        self,
        search_term: str,
        conversation_id: Optional[UUID] = None,
        limit: int = 20
    ) -> List[ChatMessage]:
        """Search message content (case-insensitive)"""
        try:
            search_pattern = f"%{search_term}%"
            query = self.db.query(ChatMessage).filter(
                ChatMessage.content.ilike(search_pattern)
            )
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            messages = query.order_by(
                desc(ChatMessage.timestamp)
            ).limit(limit).all()
            logger.debug(f"Search '{search_term}' found {len(messages)} messages")
            return messages
        except Exception as e:
            logger.error(f"Error searching messages: {e}")
            return []
    
    def get_messages_with_sql(
        self,
        conversation_id: Optional[UUID] = None
    ) -> List[ChatMessage]:
        """Get messages that contain SQL queries"""
        try:
            query = self.db.query(ChatMessage).filter(
                ChatMessage.sql_query.isnot(None)
            )
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            messages = query.order_by(desc(ChatMessage.timestamp)).all()
            logger.debug(f"Found {len(messages)} messages with SQL queries")
            return messages
        except Exception as e:
            logger.error(f"Error getting messages with SQL: {e}")
            return []
    
    def get_messages_by_source(
        self,
        source: str,
        conversation_id: Optional[UUID] = None,
        limit: int = 100
    ) -> List[ChatMessage]:
        """Get messages filtered by source"""
        try:
            query = self.db.query(ChatMessage).filter(
                ChatMessage.source == source
            )
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            messages = query.order_by(
                desc(ChatMessage.timestamp)
            ).limit(limit).all()
            logger.debug(f"Found {len(messages)} messages from source '{source}'")
            return messages
        except Exception as e:
            logger.error(f"Error getting messages by source: {e}")
            return []
    
    def get_average_response_time(
        self,
        conversation_id: Optional[UUID] = None
    ) -> float:
        """Calculate average response time for assistant messages"""
        try:
            query = self.db.query(
                func.avg(ChatMessage.response_time_ms)
            ).filter(
                and_(
                    ChatMessage.role == 'assistant',
                    ChatMessage.response_time_ms.isnot(None)
                )
            )
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            
            avg_time = query.scalar()
            return float(avg_time) if avg_time else 0.0
        except Exception as e:
            logger.error(f"Error calculating average response time: {e}")
            return 0.0
    
    def get_messages_with_visualizations(
        self,
        conversation_id: Optional[UUID] = None
    ) -> List[ChatMessage]:
        """Get messages that include visualizations"""
        try:
            query = self.db.query(ChatMessage).filter(
                ChatMessage.visualization_data.isnot(None)
            )
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            messages = query.order_by(desc(ChatMessage.timestamp)).all()
            logger.debug(f"Found {len(messages)} messages with visualizations")
            return messages
        except Exception as e:
            logger.error(f"Error getting messages with visualizations: {e}")
            return []
    
    def get_statistics(
        self,
        conversation_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get various statistics about messages"""
        try:
            query = self.db.query(ChatMessage)
            if conversation_id is not None:
                query = query.filter(ChatMessage.conversation_id == conversation_id)
            total = query.count()
            user_count = query.filter(ChatMessage.role == 'user').count()
            assistant_count = query.filter(ChatMessage.role == 'assistant').count()
            avg_time = self.get_average_response_time(conversation_id)
            db_count = query.filter(ChatMessage.source == 'database').count()
            web_count = query.filter(ChatMessage.source == 'web').count()
            viz_count = query.filter(ChatMessage.visualization_data.isnot(None)).count()
            stats = {
                'total_messages': total,
                'user_messages': user_count,
                'assistant_messages': assistant_count,
                'avg_response_time': avg_time,
                'database_count': db_count,
                'web_search_count': web_count,
                'visualization_count': viz_count,
            }
            logger.debug(f"Calculated statistics: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {
                'total_messages': 0,
                'user_messages': 0,
                'assistant_messages': 0,
                'avg_response_time': 0.0,
                'database_count': 0,
                'web_search_count': 0,
                'visualization_count': 0,
            }

# HELPER FUNCTIONS
def get_chat_message_repository(db: Session) -> ChatMessageRepository:
    return ChatMessageRepository(db)