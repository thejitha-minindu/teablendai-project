from typing import Optional, Dict, Any
from src.infrastructure.services.chat_service import ChatService


class ChatUseCase:

    def __init__(self, chat_service: ChatService):
        self.chat_service = chat_service

    async def execute(
        self,
        message: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:

        return await self.chat_service.process_message(
            user_message=message,
            conversation_id=conversation_id,
            user_id=user_id
        )
