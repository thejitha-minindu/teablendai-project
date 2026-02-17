"""
Conversations route for TeaBlendAI API.
Backed by MSSQL chat history tables (Conversations, Messages).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from src.application.dependencies import get_history_db

logger = logging.getLogger(__name__)

router = APIRouter()

class Conversation(BaseModel):
    """Conversation model."""
    id: int
    title: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    message_count: int


class Message(BaseModel):
    """Message model with visualization support."""
    id: int
    conversation_id: int
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None
    sql_query: Optional[str] = None
    visualization_type: Optional[str] = None  # "bar", "line", "pie", "table"
    visualization: Optional[Dict[str, Any]] = None  # Chart.js config or table data
    source: Optional[str] = None  # "database", "web", "validation", "error"
    search_results: Optional[List[Dict[str, str]]] = None
    response_time_ms: Optional[int] = None


@router.get("/conversations")
async def list_conversations(limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """List conversations from MSSQL with pagination."""
    try:
        history = get_history_db()
        conversations = history.get_conversations(limit=limit)
        return {
            "success": True,
            "conversations": conversations,
            "total": len(conversations),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: int) -> Dict[str, Any]:
    """Get a specific conversation with its messages from MSSQL."""
    try:
        history = get_history_db()
        messages = history.get_conversation_messages(conversation_id)
        if not messages:
            # Still return structure if empty
            return {"success": True, "conversation": {"id": conversation_id}, "messages": []}
        # Build minimal conversation header from messages
        convo = {
            "id": conversation_id,
            "title": f"Conversation - {conversation_id}",
            "created_at": messages[0].get("timestamp"),
            "updated_at": messages[-1].get("timestamp"),
            "message_count": len(messages)
        }
        return {"success": True, "conversation": convo, "messages": messages}
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations")
async def create_conversation(title: Optional[str] = None) -> Dict[str, Any]:
    """Create a new conversation in MSSQL."""
    try:
        history = get_history_db()
        conv_id = history.create_conversation(title)
        return {"success": True, "conversation": {"id": conv_id, "title": title or f"Conversation - {conv_id}"}}
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/new")
async def create_conversation_compat(payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Compatibility endpoint for frontend expecting /conversations/new with optional title."""
    title = (payload or {}).get("title") if isinstance(payload, dict) else None
    return await create_conversation(title)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int) -> Dict[str, Any]:
    """Delete a conversation from MSSQL."""
    try:
        history = get_history_db()
        history.delete_conversation(conversation_id)
        return {"success": True, "message": "Conversation deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: int,
    role: str,
    content: str
) -> Dict[str, Any]:
    """Add a message to a conversation in MSSQL."""
    try:
        history = get_history_db()
        # Store without SQL/data/viz context in this helper endpoint
        history.save_message(conversation_id, role, content)
        return {"success": True, "message": {
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }}
    except Exception as e:
        logger.error(f"Error adding message: {e}")
        raise HTTPException(status_code=500, detail=str(e))