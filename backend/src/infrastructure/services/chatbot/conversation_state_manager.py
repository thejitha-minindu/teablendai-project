"""
Conversation State Manager (Database-Persistent Edition)

Manages multi-turn conversation state for complex operations (e.g., interactive auction creation).
Persists state into the database with write-through memory caching and TTL expiration.
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy import text
from src.infrastructure.database.connection import SessionLocal

logger = logging.getLogger(__name__)


@dataclass
class ConversationState:
    """State for a multi-turn conversation flow"""
    conversation_id: UUID
    state_type: str
    action: str
    partial_data: Dict[str, Any] = field(default_factory=dict)
    required_fields: List[str] = field(default_factory=list)
    optional_fields: List[str] = field(default_factory=list)
    confirmation_pending: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    expires_at: datetime = field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(minutes=30)).replace(tzinfo=None))

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at

    def get_missing_required_fields(self) -> List[str]:
        return [
            field for field in self.required_fields
            if field not in self.partial_data or self.partial_data[field] is None
        ]

    def is_complete(self) -> bool:
        return len(self.get_missing_required_fields()) == 0

    def update_field(self, field_name: str, value: Any):
        self.partial_data[field_name] = value
        if field_name in self.required_fields and value is not None:
            self.required_fields.remove(field_name)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "conversation_id": str(self.conversation_id),
            "state_type": self.state_type,
            "action": self.action,
            "partial_data": self.partial_data,
            "required_fields": self.required_fields,
            "optional_fields": self.optional_fields,
            "confirmation_pending": self.confirmation_pending,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationState":
        created_at = datetime.fromisoformat(data["created_at"]) if isinstance(data["created_at"], str) else data["created_at"]
        expires_at = datetime.fromisoformat(data["expires_at"]) if isinstance(data["expires_at"], str) else data["expires_at"]
        conv_id = UUID(str(data["conversation_id"])) if isinstance(data["conversation_id"], (str, UUID)) else data["conversation_id"]

        return cls(
            conversation_id=conv_id,
            state_type=data["state_type"],
            action=data["action"],
            partial_data=data.get("partial_data", {}),
            required_fields=data.get("required_fields", []),
            optional_fields=data.get("optional_fields", []),
            confirmation_pending=bool(data.get("confirmation_pending", False)),
            created_at=created_at,
            expires_at=expires_at,
        )


class ConversationStateManager:
    """
    Manages conversation state across multiple turns with database persistence.
    Provides fast in-memory caching backed by MSSQL storage.
    """

    def __init__(self):
        self._states: Dict[UUID, ConversationState] = {}
        self._table_initialized = False
        self._ensure_table_exists()
        logger.info("[StateManager] Initialized with Database Persistence")

    def _ensure_table_exists(self):
        """Creates the state persistence table in MSSQL if it doesn't already exist."""
        if self._table_initialized:
            return
        try:
            with SessionLocal() as db:
                db.execute(text("""
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chatbot_conversation_states' AND xtype='U')
                    BEGIN
                        CREATE TABLE chatbot_conversation_states (
                            conversation_id UNIQUEIDENTIFIER PRIMARY KEY,
                            state_type NVARCHAR(100) NOT NULL,
                            action NVARCHAR(100) NOT NULL,
                            partial_data NVARCHAR(MAX) NULL,
                            required_fields NVARCHAR(MAX) NULL,
                            optional_fields NVARCHAR(MAX) NULL,
                            confirmation_pending BIT NOT NULL DEFAULT 0,
                            created_at DATETIME2 NOT NULL,
                            expires_at DATETIME2 NOT NULL
                        );
                    END
                """))
                db.commit()
                self._table_initialized = True
        except Exception as e:
            logger.warning(f"[StateManager] Table check/create notice: {e}")

    def _db_save(self, state: ConversationState):
        """Saves or updates state in database"""
        try:
            self._ensure_table_exists()
            with SessionLocal() as db:
                db.execute(
                    text("""
                        MERGE chatbot_conversation_states AS target
                        USING (SELECT :conv_id AS conversation_id) AS source
                        ON (target.conversation_id = source.conversation_id)
                        WHEN MATCHED THEN
                            UPDATE SET
                                state_type = :state_type,
                                action = :action,
                                partial_data = :partial_data,
                                required_fields = :required_fields,
                                optional_fields = :optional_fields,
                                confirmation_pending = :confirmation_pending,
                                expires_at = :expires_at
                        WHEN NOT MATCHED THEN
                            INSERT (conversation_id, state_type, action, partial_data, required_fields, optional_fields, confirmation_pending, created_at, expires_at)
                            VALUES (:conv_id, :state_type, :action, :partial_data, :required_fields, :optional_fields, :confirmation_pending, :created_at, :expires_at);
                    """),
                    {
                        "conv_id": str(state.conversation_id),
                        "state_type": state.state_type,
                        "action": state.action,
                        "partial_data": json.dumps(state.partial_data),
                        "required_fields": json.dumps(state.required_fields),
                        "optional_fields": json.dumps(state.optional_fields),
                        "confirmation_pending": 1 if state.confirmation_pending else 0,
                        "created_at": state.created_at,
                        "expires_at": state.expires_at,
                    }
                )
                db.commit()
        except Exception as e:
            logger.warning(f"[StateManager] Failed to persist state to database for conv {state.conversation_id}: {e}")

    def _db_load(self, conversation_id: UUID) -> Optional[ConversationState]:
        """Loads state from database if not in memory"""
        try:
            self._ensure_table_exists()
            with SessionLocal() as db:
                row = db.execute(
                    text("""
                        SELECT conversation_id, state_type, action, partial_data, required_fields, optional_fields, confirmation_pending, created_at, expires_at
                        FROM chatbot_conversation_states
                        WHERE conversation_id = :conv_id
                    """),
                    {"conv_id": str(conversation_id)}
                ).mappings().first()

                if row:
                    state_dict = {
                        "conversation_id": row["conversation_id"],
                        "state_type": row["state_type"],
                        "action": row["action"],
                        "partial_data": json.loads(row["partial_data"] or "{}"),
                        "required_fields": json.loads(row["required_fields"] or "[]"),
                        "optional_fields": json.loads(row["optional_fields"] or "[]"),
                        "confirmation_pending": bool(row["confirmation_pending"]),
                        "created_at": row["created_at"],
                        "expires_at": row["expires_at"],
                    }
                    state = ConversationState.from_dict(state_dict)
                    if not state.is_expired():
                        self._states[conversation_id] = state
                        logger.info(f"[StateManager] Restored state from database for conv {conversation_id}")
                        return state
                    else:
                        logger.info(f"[StateManager] Expired state found in database for conv {conversation_id}. Cleaning up.")
                        self._db_delete(conversation_id)
        except Exception as e:
            logger.warning(f"[StateManager] Failed to load state from database for conv {conversation_id}: {e}")
        return None

    def _db_delete(self, conversation_id: UUID):
        """Deletes state from database"""
        try:
            self._ensure_table_exists()
            with SessionLocal() as db:
                db.execute(
                    text("DELETE FROM chatbot_conversation_states WHERE conversation_id = :conv_id"),
                    {"conv_id": str(conversation_id)}
                )
                db.commit()
        except Exception as e:
            logger.warning(f"[StateManager] Failed to delete state from database for conv {conversation_id}: {e}")

    def create_state(
        self,
        conversation_id: UUID,
        state_type: str,
        action: str,
        required_fields: List[str],
        optional_fields: List[str] = None,
        initial_data: Dict[str, Any] = None
    ) -> ConversationState:
        """Create new conversation state and persist to database"""
        state = ConversationState(
            conversation_id=conversation_id,
            state_type=state_type,
            action=action,
            partial_data=initial_data or {},
            required_fields=required_fields.copy(),
            optional_fields=optional_fields or []
        )

        self._states[conversation_id] = state
        self._db_save(state)
        logger.info(f"[StateManager] Created & persisted state for conv {conversation_id}: {action}")

        return state

    def get_state(self, conversation_id: UUID) -> Optional[ConversationState]:
        """Get state for a conversation from memory or database fallback"""
        state = self._states.get(conversation_id)

        if state is None:
            state = self._db_load(conversation_id)

        if state is None:
            return None

        if state.is_expired():
            logger.warning(f"[StateManager] State expired for conv {conversation_id}")
            self.delete_state(conversation_id)
            return None

        return state

    def update_state(self, conversation_id: UUID, updates: Dict[str, Any]):
        """Update state with new data and persist to database"""
        state = self.get_state(conversation_id)
        if state is None:
            return

        for field, value in updates.items():
            state.update_field(field, value)

        self._db_save(state)

    def delete_state(self, conversation_id: UUID):
        """Delete state from memory and database"""
        if conversation_id in self._states:
            del self._states[conversation_id]
        self._db_delete(conversation_id)
        logger.info(f"[StateManager] Deleted state for conv {conversation_id}")

    def set_confirmation_pending(self, conversation_id: UUID, pending: bool = True):
        """Mark state as waiting for confirmation and persist"""
        state = self.get_state(conversation_id)
        if state:
            state.confirmation_pending = pending
            self._db_save(state)


# Global singleton instance
state_manager = ConversationStateManager()