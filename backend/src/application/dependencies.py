from functools import lru_cache
from typing import Callable, Literal, Optional, Dict, Any
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status

from src.database import get_db, get_engine

from src.application.use_cases.chatbot.chat.chat_use_case import ChatUseCase
from src.application.security import SECRET_KEY, ALGORITHM
from src.domain.models.user import User
from src.domain.models.admin import Admin
from src.infrastructure.services.chatbot.chat_service import ChatService
from src.infrastructure.services.chatbot.mcp_client_manager import MCPClientManager
from src.infrastructure.database.chat_history import ChatHistoryDB
from src.infrastructure.repositories import ConversationRepository, ChatMessageRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

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
    conversation_repo = ConversationRepository(db)
    message_repo = ChatMessageRepository(db)
    return ChatService(
        conversation_repo=conversation_repo,
        message_repo=message_repo,
        mcp_client=mcp_client
    )

def get_chat_use_case(
    chat_service: ChatService = Depends(get_chat_service)
) -> ChatUseCase:
    return ChatUseCase(chat_service)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    return _decode_token(token)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = _decode_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    # Find the user in the database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = _decode_token(token)
    email: str = payload.get("sub")
    role: str = payload.get("role")
    
    if email is None or role != "admin":
        raise credentials_exception
        
    # Find the admin in the database
    admin = db.query(Admin).filter(Admin.email == email).first()
    if admin is None:
        raise credentials_exception
    
    return admin


def get_active_role(payload: dict = Depends(get_token_payload)) -> Literal["buyer", "seller"]:
    role = payload.get("role")
    if role not in ("buyer", "seller"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid role in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return role


def require_role(required_role: Literal["buyer", "seller"]) -> Callable:
    def _role_dependency(active_role: str = Depends(get_active_role)) -> str:
        if active_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role.capitalize()} role required",
            )
        return active_role

    return _role_dependency


def get_current_buyer(
    current_user: User = Depends(get_current_user),
    _role: str = Depends(require_role("buyer")),
) -> User:
    return current_user


def get_current_seller(
    current_user: User = Depends(get_current_user),
    _role: str = Depends(require_role("seller")),
) -> User:
    return current_user


def get_optional_current_seller(
    token: str | None = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None

    payload = _decode_token(token)
    email: str | None = payload.get("sub")
    role: str | None = payload.get("role")

    if email is None or role != "seller":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate seller credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate seller credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None

    payload = _decode_token(token)
    email: str | None = payload.get("sub")

    if email is None:
        return None

    user = db.query(User).filter(User.email == email).first()
    return user


def get_optional_token_payload(
    token: str | None = Depends(optional_oauth2_scheme),
) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    return _decode_token(token)