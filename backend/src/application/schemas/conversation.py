from typing import List, Optional
from pydantic import BaseModel

class Conversation(BaseModel):
    id: int
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
    conversation_id: int