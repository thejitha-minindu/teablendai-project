from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from src.application.use_cases.chat.chat_use_case import ChatUseCase
from src.application.dependencies import get_chat_use_case


router = APIRouter(prefix="/chat", tags=["Chatbot"])
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    user_id: Optional[int] = None

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
async def get_chat_history(conversation_id: int):
    """Alias for /conversations/{id}/messages"""
    from src.presentation.routers.v1.conversations import get_conversation
    return await get_conversation(conversation_id)
