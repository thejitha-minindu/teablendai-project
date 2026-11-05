"""Regression coverage for Docker env-file keys and private-data fallbacks."""
from datetime import datetime, timezone
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from src.config import Settings


@pytest.mark.parametrize("raw,expected", [
    ('"test-key"', "test-key"),
    ("'test-key'", "test-key"),
    ('  "test-key"  ', "test-key"),
    ("test-key", "test-key"),
    ('""', None),
    ("  ", None),
    (None, None),
    ("test'key", "test'key"),
])
def test_ai_keys_are_normalized_for_all_clients(raw, expected):
    settings = Settings(_env_file=None, JWT_SECRET_KEY="test-only-secret",
                        GOOGLE_API_KEY=raw, TAVILY_API_KEY=raw)
    assert settings.GOOGLE_API_KEY == expected
    assert settings.TAVILY_API_KEY == expected


@pytest.mark.asyncio
@pytest.mark.parametrize("question,should_search", [
    ("Which blends had the highest profit margins in 2024?", False),
    ("Tell me about our blend sales and profit margins", False),
    ("Show scheduled auctions", False),
    ("Explain tea oxidation", True),
])
async def test_database_failure_searches_only_public_knowledge(question, should_search):
    from src.infrastructure.services.chatbot.chat_service import ChatService

    service = ChatService.__new__(ChatService)
    service._get_followup_visualization_context = Mock(return_value=None)
    service.message_repo = Mock()
    service.mcp_client = SimpleNamespace(
        query_database=AsyncMock(return_value={
            "success": False, "message": "Failed to process natural language query",
            "details": "Database schema is temporarily unavailable; retry the request.",
        }),
        search_web=AsyncMock(return_value={"success": True, "answer": "Public tea knowledge", "results": []}),
    )
    conversation = SimpleNamespace(conversation_id=uuid4())
    result = await service._handle_database_query(question, conversation, datetime.now(timezone.utc))
    assert service.mcp_client.search_web.await_count == int(should_search)
    assert result["source"] == ("web" if should_search else "error")


@pytest.mark.asyncio
@pytest.mark.parametrize("question", ["Which blends had the highest profit margins in 2024?", "Show a bar chart of 2024 blend margins"])
async def test_summary_retains_executed_date_filter_without_date_result_column(question):
    from src.infrastructure.services.chatbot.chat_service import ChatService

    service = ChatService.__new__(ChatService)
    service.llm = SimpleNamespace(ainvoke=AsyncMock(return_value=SimpleNamespace(
        content=json.dumps({"summary": "2024 margins", "visualization_type": "bar"}))))
    sql = "SELECT BlendName, margin FROM margins WHERE SaleDate >= '20240101' AND SaleDate < '20250101'"
    await service._summarize_and_choose_viz(question, ["BlendName", "margin"],
                                          [{"BlendName": "Test blend", "margin": 12.5}], ["bar"], sql_query=sql)
    messages = service.llm.ainvoke.call_args.args[0]
    context = json.loads(messages[1].content)
    assert context["executed_sql"] == sql
    assert "SaleDate" not in context["columns"]


@pytest.mark.asyncio
async def test_valid_profit_results_are_not_replaced_by_web_search():
    from src.infrastructure.services.chatbot.chat_service import ChatService

    service = ChatService.__new__(ChatService)
    service._get_followup_visualization_context = Mock(return_value=None)
    service._verify_data_relevance = AsyncMock(return_value=False)
    service._summarize_and_choose_viz = AsyncMock(return_value={"summary": "2024 margins", "visualization_type": "bar"})
    service.message_repo = Mock()
    rows = [{"BlendName": "Test blend", "profit_margin": 12.5}]
    service.mcp_client = SimpleNamespace(
        query_database=AsyncMock(return_value={
            "success": True, "has_data": True, "raw_data": rows,
            "columns": ["BlendName", "profit_margin"],
            "sql_query": "SELECT BlendName, profit_margin FROM margins WHERE SaleDate >= '20240101'",
        }),
        search_web=AsyncMock(),
        create_visualization=AsyncMock(return_value={"success": True, "visualization": "chart"}),
    )
    result = await service._handle_database_query(
        "Which blends had the highest profit margins in 2024?",
        SimpleNamespace(conversation_id=uuid4()), datetime.now(timezone.utc))
    service._verify_data_relevance.assert_not_awaited()
    service.mcp_client.search_web.assert_not_awaited()
    assert result["source"] == "database"
    assert result["data"] == rows


@pytest.mark.asyncio
async def test_what_makes_tea_unique_routes_directly_to_web_knowledge():
    from src.infrastructure.services.chatbot.intent_classifier import IntentClassifier

    classifier = IntentClassifier()
    result = await classifier.classify_semantic("What makes Dimbula tea unique?")
    assert classifier.classify_fast("What makes Dimbula tea unique?") == "knowledge"
    assert result.is_tea_or_platform_related is True
    assert result.intent == "knowledge"
    assert result.target_domain == "botany_culture"
    assert classifier._llm is None


@pytest.mark.asyncio
async def test_profit_question_keeps_database_route_without_gemini_quota():
    from src.infrastructure.services.chatbot.intent_classifier import IntentClassifier

    classifier = IntentClassifier()
    result = await classifier.classify_semantic("Which blends had the highest profit margins in 2024?")
    assert result.intent == "database"
    assert result.is_tea_or_platform_related is True
    assert classifier._llm is None


@pytest.mark.asyncio
async def test_off_topic_guardrail_works_without_gemini():
    from src.infrastructure.services.chatbot.intent_classifier import IntentClassifier

    classifier = IntentClassifier()
    classifier._get_guardrail_llm = Mock(side_effect=RuntimeError("Gemini quota exceeded"))
    result = await classifier.classify_semantic("How do I play basketball?")
    assert result.intent == "off_topic"
    assert result.is_tea_or_platform_related is False


@pytest.mark.asyncio
async def test_profit_margin_sql_fallback_when_gemini_quota_is_exhausted():
    from src.infrastructure.services.chatbot.mcp.tea_database.sql_generator import SQLGenerator

    generator = SQLGenerator.__new__(SQLGenerator)
    generator.llm = SimpleNamespace(ainvoke=AsyncMock(side_effect=RuntimeError("429 quota exceeded")))
    schema = "TABLE: TeaBlendSale\nTABLE: BlendPurchaseMapping\nTABLE: TeaPurchase"
    sql = await generator.generate_sql("Which blends had the highest profit margins in 2024?", schema)
    upper = sql.upper()
    assert upper.startswith("SELECT TOP 100")
    assert "SALEDATE >= '2024-01-01'" in upper
    assert "SALEDATE < '2025-01-01'" in upper
    assert "GROUP BY BPM.SALEID" in upper
