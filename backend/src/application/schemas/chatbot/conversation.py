from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

class Conversation(BaseModel):
    id: UUID
    title: str
    created_at: str
    updated_at: str
    preview: Optional[str] = None

class ConversationListResponse(BaseModel):
    success: bool
    conversations: List[Conversation]

class ConversationResponse(BaseModel):
    success: bool
    conversation: Conversation
    messages: List[dict]

class NewConversationResponse(BaseModel):
    success: bool
    conversation_id: UUID