"""
Conversation State Manager

Manages multi-turn conversation state for complex operations.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


@dataclass
class ConversationState:
    """State for a multi-turn conversation flow"""
    conversation_id: int
    state_type: str
    action: str
    partial_data: Dict[str, Any] = field(default_factory=dict)
    required_fields: List[str] = field(default_factory=list)
    optional_fields: List[str] = field(default_factory=list)
    confirmation_pending: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=30))
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def get_missing_required_fields(self) -> List[str]:
        return [
            field for field in self.required_fields
            if field not in self.partial_data or self.partial_data[field] is None
        ]
    
    def is_complete(self) -> bool:
        return len(self.get_missing_required_fields()) == 0
    
    def update_field(self, field_name: str, value: Any):
        self.partial_data[field_name] = value
        if field_name in self.required_fields:
            self.required_fields.remove(field_name)


class ConversationStateManager:
    """Manages conversation state across multiple turns"""
    
    def __init__(self):
        self._states: Dict[int, ConversationState] = {}
        logger.info("[StateManager] Initialized")
    
    def create_state(
        self,
        conversation_id: int,
        state_type: str,
        action: str,
        required_fields: List[str],
        optional_fields: List[str] = None,
        initial_data: Dict[str, Any] = None
    ) -> ConversationState:
        """Create new conversation state"""
        state = ConversationState(
            conversation_id=conversation_id,
            state_type=state_type,
            action=action,
            partial_data=initial_data or {},
            required_fields=required_fields.copy(),
            optional_fields=optional_fields or []
        )
        
        self._states[conversation_id] = state
        logger.info(f"[StateManager] Created state for conv {conversation_id}: {action}")
        
        return state
    
    def get_state(self, conversation_id: int) -> Optional[ConversationState]:
        """Get state for a conversation"""
        state = self._states.get(conversation_id)
        
        if state is None:
            return None
        
        if state.is_expired():
            logger.warning(f"[StateManager] State expired for conv {conversation_id}")
            self.delete_state(conversation_id)
            return None
        
        return state
    
    def update_state(self, conversation_id: int, updates: Dict[str, Any]):
        """Update state with new data"""
        state = self.get_state(conversation_id)
        if state is None:
            return
        
        for field, value in updates.items():
            state.update_field(field, value)
    
    def delete_state(self, conversation_id: int):
        """Delete state for a conversation"""
        if conversation_id in self._states:
            del self._states[conversation_id]
            logger.info(f"[StateManager] Deleted state for conv {conversation_id}")
    
    def set_confirmation_pending(self, conversation_id: int, pending: bool = True):
        """Mark state as waiting for confirmation"""
        state = self.get_state(conversation_id)
        if state:
            state.confirmation_pending = pending


# Global singleton
state_manager = ConversationStateManager()