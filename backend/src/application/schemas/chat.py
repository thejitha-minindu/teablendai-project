from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class ChatMessage(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    sql_query: Optional[str] = None
    data: Optional[List[dict]] = None
    visualization_type: Optional[str] = None
    visualization: Optional[str] = None
    source: Optional[str] = None
    search_results: Optional[List[dict]] = None
    columns: Optional[List[dict]] = None
    row_count: Optional[int] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class ChatResponse(BaseModel):
    success: bool
    conversation_id: int
    answer: str
    timestamp: datetime
    sql_query: Optional[str] = None
    data: Optional[List[dict]] = None
    columns: Optional[List[dict]] = None
    row_count: Optional[int] = None
    visualization_type: Optional[str] = None
    visualization: Optional[str] = None
    source: Optional[str] = None
    search_results: Optional[List[dict]] = None
    error: Optional[str] = None