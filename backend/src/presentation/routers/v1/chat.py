from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID

from src.application.use_cases.chat.chat_use_case import ChatUseCase
from src.application.dependencies import get_chat_use_case, get_history_db


router = APIRouter(prefix="/chat", tags=["Chatbot"])
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None
    user_id: Optional[str] = None

@router.post("/")
async def chat(
    request: ChatRequest,
    use_case: ChatUseCase = Depends(get_chat_use_case)
):
    return await use_case.execute(
        message=request.message,
        conversation_id=request.conversation_id,
        user_id=request.user_id
    )

@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: UUID) -> Dict[str, Any]:
    """Fetches the chat history for a given conversation ID."""
    history = get_history_db()
    messages = history.get_conversation_messages(conversation_id)

    if not messages:
        return {"success": True, "conversation": {"id": conversation_id}, "messages": []}

    convo = {
        "id": conversation_id,
        "title": f"Conversation - {conversation_id}",
        "created_at": messages[0].get("timestamp"),
        "updated_at": messages[-1].get("timestamp"),
        "message_count": len(messages),
    }
    return {"success": True, "conversation": convo, "messages": messages}