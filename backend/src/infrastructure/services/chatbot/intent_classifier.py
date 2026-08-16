"""
Query Intent Classifier & LLM Safety Guardrail

Two-tier semantic intent classification:
Tier 1: Fast Rule & Domain Heuristic Matcher (< 1ms)
Tier 2: Async Semantic LLM Guardrail (Gemini Flash Structured Output)
"""

import logging
import re
from typing import Literal, List, Optional, Dict, Any
from pydantic import BaseModel, Field

from langchain_google_genai import ChatGoogleGenerativeAI
from src.config import get_settings

logger = logging.getLogger(__name__)

QueryIntent = Literal[
    "database",
    "knowledge",
    "hybrid",
    "auction_management",
    "general_greeting",
    "off_topic",
]


class SemanticClassificationResult(BaseModel):
    """Structured classification & safety guardrail output"""
    is_tea_or_platform_related: bool = Field(
        description="True if query relates to tea, Ceylon tea regions, tea chemistry, auctions, sales, blends, or platform features."
    )
    intent: QueryIntent = Field(
        description="Operational intent: database (OLAP/sales/data queries), knowledge (tea science/brewing/history), hybrid (both), auction_management (creating/editing/canceling auctions), general_greeting (friendly greetings), or off_topic."
    )
    target_domain: Optional[str] = Field(
        default="general",
        description="Sub-domain: 'analytics_warehouse', 'live_auction', 'botany_culture', 'tea_standards', or 'support'."
    )
    reasoning: str = Field(
        description="Short 1-sentence rationale for the routing decision."
    )
    rejection_or_greeting_message: Optional[str] = Field(
        default=None,
        description="If off_topic or general_greeting, the custom response text to deliver to the user."
    )
    suggested_questions: List[str] = Field(
        default_factory=list,
        description="2-3 relevant tea business or auction questions to suggest."
    )


class IntentClassifier:
    """Classify user queries by semantic intent with LLM safety guardrails"""

    GREETING_PATTERNS = [
        r"^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings|ayubowan)\b",
        r"^(who\s+are\s+you|what\s+can\s+you\s+do|help|how\s+can\s+you\s+help)\b",
    ]

    AUCTION_ACTION_PATTERNS = [
        r"\b(?:create|new|add|start|post|schedule)\b[\w\s#:\-]{0,120}\bauction\b",
        r"\b(?:update|change|modify|edit)\b[\w\s#:\-]{0,120}\bauction\b",
        r"\b(?:delete|remove|cancel|close)\b[\w\s#:\-]{0,120}\bauction\b",
        r"\bauction\b[\w\s#:\-]{0,120}\b(?:update|change|modify|edit|delete|remove|cancel|close)\b",
    ]

    DATABASE_INDICATORS = {
        'how many', 'how much', 'count', 'number of',
        'total', 'sum', 'average', 'median', 'min', 'max',
        'show', 'show me', 'list', 'display', 'find',
        'get', 'fetch', 'give me', 'tell me the',
        'customer', 'customers', 'buyer', 'buyers',
        'supplier', 'suppliers', 'vendor', 'vendors',
        'purchase', 'purchases', 'sale', 'sales',
        'transaction', 'order', 'invoice',
        'price', 'prices', 'cost', 'revenue',
        'quantity', 'amount', 'volume',
        'group by', 'breakdown', 'categorize',
        'top', 'bottom', 'highest', 'lowest', 'best', 'worst',
    }

    KNOWLEDGE_INDICATORS = {
        'what is', 'what are', 'what does', 'define',
        'explain', 'describe', 'tell me about',
        'health benefit', 'benefits', 'good for',
        'how to brew', 'how to steep', 'preparation',
        'flavor', 'flavour', 'taste', 'aroma',
        'history', 'historical', 'origin', 'elevation',
        'ceylon tea', 'difference between', 'why is',
    }

    def __init__(self):
        self._llm = None

    def _get_guardrail_llm(self):
        """Lazy load Gemini Flash structured model for Tier-2 guardrail"""
        if self._llm is None:
            settings = get_settings()
            base_llm = ChatGoogleGenerativeAI(
                model=settings.MODEL_NAME,
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.0,
            )
            self._llm = base_llm.with_structured_output(SemanticClassificationResult)
        return self._llm

    def is_greeting(self, question: str) -> bool:
        q = question.lower().strip()
        return any(re.search(pat, q) for pat in self.GREETING_PATTERNS)

    def is_auction_management_request(self, question: str) -> bool:
        q = question.lower().strip()
        if 'auction' not in q:
            return False

        read_only = [
            'show my auction', 'list my auction', 'view my auction', 'display my auction',
            'show me my auction', 'give me my auction', 'auction history', 'scheduled auction',
            'live auction', 'active auction', 'auction details', 'auction status'
        ]
        if any(phrase in q for phrase in read_only):
            return False

        return any(re.search(pat, q) for pat in self.AUCTION_ACTION_PATTERNS)

    def classify_fast(self, question: str) -> Optional[QueryIntent]:
        """Tier 1: Fast Rule & Domain Heuristic Matcher (< 1ms)"""
        q = question.lower().strip()

        if self.is_greeting(q) and len(q.split()) <= 6:
            return "general_greeting"

        if self.is_auction_management_request(q):
            return "auction_management"

        db_score = sum(1 for ind in self.DATABASE_INDICATORS if ind in q)
        know_score = sum(1 for ind in self.KNOWLEDGE_INDICATORS if ind in q)

        if db_score > 0 and know_score > 0:
            return "hybrid"
        if db_score >= 2:
            return "database"
        if know_score >= 2:
            return "knowledge"

        return None

    def classify(self, question: str) -> QueryIntent:
        """Synchronous legacy interface with smart fallbacks"""
        fast_result = self.classify_fast(question)
        if fast_result is not None:
            return fast_result

        q = question.lower().strip()
        if any(q.startswith(p) for p in ['what is', 'what are', 'why', 'how to']):
            return "knowledge"
        return "database"

    async def classify_semantic(
        self,
        question: str,
        history_context: Optional[List[str]] = None
    ) -> SemanticClassificationResult:
        """
        Tier 2: Structured Semantic Classifier & Safety Guardrail.
        Employs Gemini Flash with Pydantic JSON enforcement.
        """
        fast_intent = self.classify_fast(question)

        if fast_intent == "general_greeting":
            return SemanticClassificationResult(
                is_tea_or_platform_related=True,
                intent="general_greeting",
                target_domain="support",
                reasoning="Fast rule matched common conversational greeting.",
                rejection_or_greeting_message=(
                    "Hello! I am your **TeaBlendAI Intelligence Assistant**. "
                    "I can help you query auction sales analytics, inspect warehouse tea blend formulations, "
                    "or manage live tea auctions. How can I assist your tea business today?"
                ),
                suggested_questions=[
                    "What are our top performing tea blends?",
                    "Show me the average price for BOPF grade",
                    "How many live auctions are currently active?"
                ]
            )

        if fast_intent == "auction_management":
            return SemanticClassificationResult(
                is_tea_or_platform_related=True,
                intent="auction_management",
                target_domain="live_auction",
                reasoning="Fast rule detected actionable auction management command.",
                suggested_questions=[]
            )

        # Use LLM Guardrail for complex / ambiguous queries
        try:
            llm = self._get_guardrail_llm()
            context_snippet = "\n".join(history_context[-3:]) if history_context else "None"

            prompt = f"""
            You are the Intent Classifier and Safety Guardrail for TeaBlendAI (Sri Lankan Tea & Auction Intelligence Platform).
            Classify the user query accurately and check if it is relevant to tea, agriculture, auction trading, or business operations.

            Recent Conversation Context:
            {context_snippet}

            User Question: "{question}"
            """

            result = await llm.ainvoke(prompt)
            if isinstance(result, SemanticClassificationResult):
                logger.info(f"[SemanticClassifier] Classified '{question[:40]}' -> {result.intent} (Related={result.is_tea_or_platform_related})")
                return result
        except Exception as e:
            logger.warning(f"[SemanticClassifier] Fallback to rule classifier due to: {e}")

        # Fallback if LLM unavailable
        fallback_intent = self.classify(question)
        return SemanticClassificationResult(
            is_tea_or_platform_related=True,
            intent=fallback_intent,
            target_domain="analytics_warehouse" if fallback_intent == "database" else "botany_culture",
            reasoning="Classified via heuristic fallback engine.",
            suggested_questions=[
                "Show monthly sales revenue",
                "What are the benefits of Ceylon BOPF?",
                "List all active auctions"
            ]
        )


# Global singleton instance
intent_classifier = IntentClassifier()