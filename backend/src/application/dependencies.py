from functools import lru_cache
from sqlalchemy.orm import Session
from fastapi import Depends

from src.database import get_db, get_engine

from src.application.use_cases.chat.chat_use_case import ChatUseCase
from src.infrastructure.services.chat_service import ChatService
from src.infrastructure.services.mcp_client_manager import MCPClientManager
from src.infrastructure.database.chat_history import ChatHistoryDB


# Singleton MCP Client
@lru_cache()
def _mcp_singleton() -> MCPClientManager:
    return MCPClientManager()

async def get_mcp_client() -> MCPClientManager:
    client = _mcp_singleton()
    if not client.is_ready():
        await client.initialize()
    return client

@lru_cache()
def get_history_db() -> ChatHistoryDB:
    engine = get_engine()
    return ChatHistoryDB(engine)

def get_chat_service(
    db: Session = Depends(get_db),
    mcp_client: MCPClientManager = Depends(get_mcp_client)
) -> ChatService:
    return ChatService(db=db, mcp_client=mcp_client)

def get_chat_use_case(
    chat_service: ChatService = Depends(get_chat_service)
) -> ChatUseCase:
    return ChatUseCase(chat_service)
