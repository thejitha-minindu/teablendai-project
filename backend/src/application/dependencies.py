from functools import lru_cache
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status

from src.database import get_db, get_engine

from src.application.use_cases.chat.chat_use_case import ChatUseCase
from src.infrastructure.services.chat_service import ChatService
from src.infrastructure.services.mcp_client_manager import MCPClientManager
from src.infrastructure.database.chat_history import ChatHistoryDB
from src.domain.models.user import User
from src.application.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token to see who it belongs to
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Find the user in the database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user