"""
Conversations route for TeaBlendAI API.
Authenticated endpoints scoped to the current user's conversations.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
import logging

from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_user
from src.domain.models.user import User
from src.domain.models.conversation import Conversation as ConversationModel
from src.infrastructure.repositories.conversation_repository_impl import ConversationRepository
from src.infrastructure.repositories.chat_repository_impl import ChatMessageRepository

logger = logging.getLogger(__name__)

router = APIRouter()

class Conversation(BaseModel):
    """Conversation model."""
    id: UUID
    title: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    message_count: int


class Message(BaseModel):
    """Message model with visualization support."""
    id: UUID
    conversation_id: UUID
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None
    sql_query: Optional[str] = None
    visualization_type: Optional[str] = None  # "bar", "line", "pie", "table"
    visualization: Optional[Dict[str, Any]] = None  # Chart.js config or table data
    source: Optional[str] = None  # "database", "web", "validation", "error"
    search_results: Optional[List[Dict[str, str]]] = None
    response_time_ms: Optional[int] = None


def _serialize_conversation(conversation: ConversationModel) -> Dict[str, Any]:
    return {
        "conversation_id": str(conversation.conversation_id),
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat() if conversation.created_at else None,
        "updated_at": conversation.updated_at.isoformat() if conversation.updated_at else None,
        "message_count": int(conversation.message_count or 0),
    }


@router.get("/conversations")
async def list_conversations(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """List conversations for the authenticated user only."""
    try:
        conversation_repo = ConversationRepository(db)
        conversations = conversation_repo.get_all(
            limit=limit,
            offset=offset,
            user_id=current_user.user_id,
            active_only=True,
        )
        serialized = [_serialize_conversation(c) for c in conversations]
        return {
            "success": True,
            "conversations": serialized,
            "total": len(serialized),
            "limit": limit,
            "offset": offset
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get a specific conversation for the authenticated user."""
    try:
        conversation_repo = ConversationRepository(db)
        message_repo = ChatMessageRepository(db)

        conversation = conversation_repo.get_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != str(current_user.user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = message_repo.get_by_conversation(conversation_id)

        return {
            "success": True,
            "conversation": _serialize_conversation(conversation),
            "messages": [msg.to_dict() for msg in messages],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations")
async def create_conversation(
    title: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new conversation for the authenticated user."""
    try:
        conversation_repo = ConversationRepository(db)
        conversation = ConversationModel.create_new(title=title, user_id=current_user.user_id)
        saved = conversation_repo.create(conversation)
        return {"success": True, "conversation": _serialize_conversation(saved)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/new")
async def create_conversation_compat(
    payload: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Compatibility endpoint for frontend expecting /conversations/new with optional title."""
    title = (payload or {}).get("title") if isinstance(payload, dict) else None
    return await create_conversation(title, current_user=current_user, db=db)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a conversation owned by the authenticated user."""
    try:
        conversation_repo = ConversationRepository(db)
        conversation = conversation_repo.get_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != str(current_user.user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation_repo.delete(conversation_id)
        return {"success": True, "message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: UUID,
    role: str,
    content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Add a message to a conversation owned by the authenticated user."""
    try:
        conversation_repo = ConversationRepository(db)
        message_repo = ChatMessageRepository(db)

        conversation = conversation_repo.get_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != str(current_user.user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")

        from src.domain.models.message import ChatMessage

        if role not in {"user", "assistant"}:
            raise HTTPException(status_code=400, detail="Invalid role")

        if role == "user":
            message = ChatMessage.create_user_message(conversation_id=conversation_id, content=content)
        else:
            message = ChatMessage.create_assistant_message(conversation_id=conversation_id, content=content)

        saved = message_repo.create(message)
        return {"success": True, "message": saved.to_dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding message: {e}")
        raise HTTPException(status_code=500, detail=str(e))