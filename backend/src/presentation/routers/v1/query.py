"""
Query route for TeaBlendAI API.
Implements tea-only policy, MCP-first DB search, and web fallback with visuals.
"""

import logging
import json

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List, Annotated
from datetime import datetime

from src.application.dependencies import get_chat_service
from src.infrastructure.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    """Request model for tea queries."""
    question: Annotated[str, Field(alias="message")]
    conversation_id: Optional[int] = None
    model_config = ConfigDict(populate_by_name=True)


class QueryResponse(BaseModel):
    """Response model for tea queries."""
    success: bool
    conversation_id: Optional[int] = None
    answer: str
    source: str
    data_type: Optional[str] = None
    state: Optional[str] = None
    message_type: Optional[str] = None
    prompt_type: Optional[str] = None
    field_metadata: Optional[Dict[str, Any]] = None
    input_request: Optional[Dict[str, Any]] = None
    validation_payload: Optional[Dict[str, Any]] = None
    auction_payload: Optional[Dict[str, Any]] = None
    result_payload: Optional[Dict[str, Any]] = None
    row_count: int = 0
    timestamp: str
    sql_query: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    visualization_type: Optional[str] = None
    visualization: Optional[str] = None
    search_results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


@router.post("/query", response_model=QueryResponse)
async def query_tea(
    request: QueryRequest,
    chat_service: ChatService = Depends(get_chat_service)
) -> QueryResponse:
    """
    Process a tea-related query.
    Tea-only guardrail; MCP-first DB; web fallback if no internal data.
    """
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        result = await chat_service.process_message(
            user_message=question,
            conversation_id=request.conversation_id
        )

        # If non-tea response
        if result.get("source") in {"validation", "system"}:
            return QueryResponse(
                success=True,
                conversation_id=result.get("conversation_id"),
                answer="I can only answer questions related to tea.",
                source="validation",
                row_count=0,
                timestamp=result.get("timestamp", datetime.utcnow().isoformat())
            )

        visualization = result.get("visualization")
        if isinstance(visualization, dict):
            visualization = json.dumps(visualization)

        return QueryResponse(
            success=bool(result.get("success")),
            conversation_id=result.get("conversation_id"),
            answer=result.get("answer", ""),
            source=result.get("source", "fallback"),
            data_type=result.get("data_type"),
            state=result.get("state"),
            message_type=result.get("message_type"),
            prompt_type=result.get("prompt_type"),
            field_metadata=result.get("field_metadata"),
            input_request=result.get("input_request"),
            validation_payload=result.get("validation_payload"),
            auction_payload=result.get("auction_payload"),
            result_payload=result.get("result_payload"),
            row_count=int(result.get("row_count", 0) or 0),
            timestamp=result.get("timestamp", datetime.utcnow().isoformat()),
            sql_query=result.get("sql_query"),
            data=result.get("data"),
            visualization_type=result.get("visualization_type"),
            visualization=visualization,  
            search_results=result.get("search_results"),
            error=result.get("error")
        )

    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@router.get("/test-query")
async def test_query() -> Dict[str, Any]:
    """Test endpoint to check query functionality."""
    return {
        "status": "ok",
        "message": "Query endpoint is working",
        "timestamp": datetime.utcnow().isoformat()
    }