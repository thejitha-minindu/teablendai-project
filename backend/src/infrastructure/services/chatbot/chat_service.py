"""
Chat Service

Main orchestration service for chatbot functionality.
Coordinates between repositories, MCP servers, and validation.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session

from src.domain.models import Conversation, ChatMessage
from src.infrastructure.repositories import (
    ConversationRepository,
    ChatMessageRepository
)
from src.infrastructure.services.chatbot.auction_handler import AuctionHandler
from src.infrastructure.services.chatbot.intent_classifier import intent_classifier, QueryIntent
from src.infrastructure.services.chatbot.conversation_state_manager import state_manager
from .mcp_client_manager import MCPClientManager
from .topic_validator import TopicValidator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from src.config import get_settings
import json

logger = logging.getLogger(__name__)


def format_duration_minutes(duration_value: Any) -> str:
    try:
        total_minutes = int(round(float(duration_value)))
    except (TypeError, ValueError):
        return str(duration_value)

    if total_minutes <= 0:
        return "0 minutes"

    hours = total_minutes // 60
    minutes = total_minutes % 60
    parts: list[str] = []

    if hours:
        parts.append(f"{hours} hour" + ("s" if hours != 1 else ""))
    if minutes:
        parts.append(f"{minutes} minute" + ("s" if minutes != 1 else ""))

    return " ".join(parts)


class ChatService:
    """
    Main chat service - orchestrates all chatbot operations
    
    Responsibilities:
    1. Validate questions are tea-related
    2. Query database via MCP
    3. Fall back to web search if needed
    4. Generate visualizations
    5. Save conversation history
    6. Return structured responses
    """
    
    def __init__(
        self,
        conversation_repo: ConversationRepository,
        message_repo: ChatMessageRepository,
        mcp_client: MCPClientManager
    ):
        """Initialize chat service"""
        self.conversation_repo = conversation_repo
        self.message_repo = message_repo
        self.mcp_client = mcp_client
        self.validator = TopicValidator()
        self.auction_handler = AuctionHandler(message_repo, mcp_client)

        self.settings = get_settings()
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.MODEL_NAME,
            google_api_key=self.settings.GOOGLE_API_KEY,
            temperature=0
        )
    
    async def process_message(
        self,
        user_message: str,
        conversation_id: Optional[UUID] = None,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message with intent-based routing.

        Args:
            user_message: User's question/message
            conversation_id: Existing conversation ID (None for new)
            user_id: User ID (for future auth)
            user_role: User role (for future permissions)

        Returns:
            Response dictionary with answer, data, visualizations, etc.
        """
        start_time = datetime.now(timezone.utc)

        # Message Length
        MAX_MESSAGE_LENGTH = 2500
        if len(user_message) > MAX_MESSAGE_LENGTH:
            logger.warning(f"[Chat] Message too long: {len(user_message)} chars")
            return {
                "success": False,
                "error": f"Message too long. Please keep questions under {MAX_MESSAGE_LENGTH} characters.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Detect Echoed AI Responses
        if self._is_echoed_response(user_message):
            logger.warning(f"[Chat] Detected echoed AI response")
            return {
                "success": True,
                "conversation_id": conversation_id,
                "answer": (
                    "It looks like you may have accidentally sent my previous response. "
                    "Could you rephrase your question?"
                ),
                "source": "validation",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        try:
            conversation_user_id = self._coerce_conversation_user_id(user_id)
            auction_user_id = str(user_id) if user_id is not None else None

            # CONVERSATION SETUP
            if conversation_id:
                conversation = self.conversation_repo.get_by_id(conversation_id)
                if not conversation:
                    raise ValueError(f"Conversation {conversation_id} not found")
                if user_id and conversation.user_id and str(conversation.user_id) != str(user_id):
                    raise ValueError("Conversation not found")
                logger.info(f"[Chat] Using existing conversation {conversation_id}")
            else:
                conversation = await self._create_conversation(user_message, conversation_user_id)
                logger.info(f"[Chat] Created conversation {conversation.conversation_id}: {conversation.title}")

            # Save user message
            user_msg = ChatMessage.create_user_message(
                conversation_id=conversation.conversation_id,
                content=user_message
            )
            self.message_repo.create(user_msg)

            # CHECK FOR EXISTING AUCTION STATE FIRST (BEFORE VALIDATION)
            state = state_manager.get_state(conversation.conversation_id)

            if state and state.state_type == "auction_management":
                logger.info(
                    f"[Chat] Continuing existing auction_management flow for conversation {conversation.conversation_id}"
                )
                return await self.auction_handler.handle_auction_management(
                    user_message=user_message,
                    conversation=conversation,
                    user_id=auction_user_id,
                    user_role=user_role
                )

            # Topic Validation (Only if NO active state)
            has_history = conversation_id is not None

            logger.info(f"[Chat] Validating question: '{user_message[:60]}' (has_history={has_history})")

            is_tea_related = self.validator.is_tea_related(
                question=user_message,
                has_conversation_history=has_history,
                conversation_id=conversation.conversation_id
            )

            logger.info(f"[Chat] Validation result: is_tea_related={is_tea_related}")

            if not is_tea_related:
                logger.warning(f"[Chat] REJECTING off-topic question: '{user_message[:60]}'")
                rejection = self.validator.get_rejection_message()

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=rejection,
                    source="validation"
                )
                self.message_repo.create(assistant_msg)

                logger.info(f"[Chat] Saved rejection message for conversation {conversation.conversation_id}")

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": rejection,
                    "source": "validation",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "suggestions": self.validator.get_suggestions(user_message)
                }

            # INTENT CLASSIFICATION & ROUTING
            intent: QueryIntent = intent_classifier.classify(user_message)
            if intent == "database" and intent_classifier.is_auction_management_request(user_message):
                logger.info("[Chat] Overriding database intent with auction_management due to auction action context")
                intent = "auction_management"
            logger.info(f"[Chat] Query intent: {intent}")

            # Route based on intent
            if intent == "knowledge":
                return await self._handle_knowledge_query(user_message, conversation)

            elif intent == "database":
                return await self._handle_database_query(user_message, conversation, start_time)

            elif intent == "hybrid":
                return await self._handle_hybrid_query(user_message, conversation)

            elif intent == "auction_management":
                return await self.auction_handler.handle_auction_management(
                    user_message=user_message,
                    conversation=conversation,
                    user_id=str(user_id) if user_id else None,
                    user_role=user_role
                )

            logger.warning(f"[Chat] Unknown intent '{intent}', defaulting to database")
            return await self._handle_database_query(user_message, conversation, start_time)
        
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)

            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
      
    async def _create_conversation(
        self,
        first_message: str,
        user_id: Optional[UUID] = None
    ) -> Conversation:
        """Create a new conversation with auto-generated title"""
        # Generate title from first message (first 50 chars)
        title = first_message[:50]
        if len(first_message) > 50:
            title += "..."
        
        # Create conversation
        conversation = Conversation.create_new(
            title=title,
            user_id=user_id
        )
        
        saved = self.conversation_repo.create(conversation)
        
        logger.info(f"Created conversation {saved.conversation_id}: {title}")
        
        return saved

    @staticmethod
    def _coerce_conversation_user_id(user_id: Optional[str]) -> Optional[UUID]:
        if user_id is None:
            return None

        try:
            return UUID(str(user_id))
        except (TypeError, ValueError):
            return None
    
    def get_conversation_history(
        self,
        conversation_id: UUID,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get conversation with message history"""
        try:
            # Get conversation with messages
            conversation = self.conversation_repo.get_with_messages(conversation_id)
            
            if not conversation:
                return {
                    "success": False,
                    "error": "Conversation not found"
                }
            
            # Get messages (limited)
            messages = self.message_repo.get_by_conversation(
                conversation_id,
                limit=limit
            )
            
            return {
                "success": True,
                "conversation": conversation.to_dict(),
                "messages": [msg.to_dict() for msg in messages],
                "total_messages": len(messages)
            }
        
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _handle_knowledge_query(
        self,
        user_message: str,
        conversation: Conversation
    ) -> Dict[str, Any]:
        """Handle questions that need general knowledge (web search)"""

        start_time = datetime.now(timezone.utc)

        logger.info("[Chat] Handling as KNOWLEDGE query - skipping database")

        # Go straight to web search
        search_result = await self.mcp_client.search_web(user_message)

        if search_result.get("success"):
            response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            answer = search_result.get("answer", "")

            # Save assistant response
            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="web",
                search_results=search_result.get("results", []),
                response_time_ms=response_time
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "web",
                "search_results": search_result.get("results", []),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "response_time_ms": response_time
            }

        # Web search failed
        fallback = (
            "I couldn't find information to answer your question. "
            "Please try rephrasing or ask a different question."
        )

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=fallback,
            source="error"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": False,
            "conversation_id": conversation.conversation_id,
            "answer": fallback,
            "source": "error"
        }

    async def _handle_database_query(
        self,
        user_message: str,
        conversation: Conversation,
        start_time: datetime
    ) -> Dict[str, Any]:
        """Handle questions about business data"""

        logger.info("[Chat] Handling as DATABASE query")

        followup_context = self._get_followup_visualization_context(
            user_message=user_message,
            conversation_id=conversation.conversation_id,
        )

        if followup_context:
            logger.info("[Chat] Using previous query data for follow-up visualization")

            rows = followup_context.get("rows", [])
            columns = followup_context.get("columns", [])

            llm_out = await self._summarize_and_choose_viz(
                question=user_message,
                columns=columns,
                rows=rows,
                candidates=["bar", "line", "pie", "table"],
            )

            chosen_type = llm_out["visualization_type"]

            viz_result = await self.mcp_client.create_visualization(
                data=rows,
                query=user_message,
                chart_type=chosen_type,
            )

            if not viz_result.get("success"):
                viz_result = {"visualization": None, "visualization_type": chosen_type}

            response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=llm_out["summary"],
                sql_query=followup_context.get("sql_query"),
                data=rows,
                source="database",
                visualization_type=chosen_type,
                visualization_data=viz_result.get("visualization"),
                response_time_ms=response_time,
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": llm_out["summary"],
                "source": "database",
                "columns": columns,
                "data": rows,
                "row_count": len(rows),
                "visualization_type": chosen_type,
                "visualization": viz_result.get("visualization"),
                "sql_query": followup_context.get("sql_query"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "response_time_ms": response_time,
            }

        db_result = await self.mcp_client.query_database(user_message)

        if db_result.get("success") and db_result.get("has_data"):
            logger.info("[Chat] Database returned data")

            q_lower = user_message.lower()
            is_obvious_data_query = any(word in q_lower for word in [
                "average", "compare", "total", "sum", "count",
                "how many", "how much", "show", "list", "price", "auction", "details"
            ])

            if is_obvious_data_query:
                logger.info("[Chat] Query is clearly data-seeking - skipping relevance check")
                is_relevant = True
            else:
                is_relevant = await self._verify_data_relevance(
                    question=user_message,
                    data=db_result.get("raw_data", []),
                    columns=db_result.get("columns", [])
                )

            if not is_relevant:
                logger.warning("[Chat] Database data NOT relevant, trying web search")
                search_result = await self.mcp_client.search_web(user_message)

                if search_result.get("success"):
                    answer = search_result.get("answer", "")
                    assistant_msg = ChatMessage.create_assistant_message(
                        conversation_id=conversation.conversation_id,
                        content=answer,
                        source="web",
                        search_results=search_result.get("results", [])
                    )
                    self.message_repo.create(assistant_msg)

                    return {
                        "success": True,
                        "conversation_id": conversation.conversation_id,
                        "answer": answer,
                        "source": "web",
                        "search_results": search_result.get("results", [])
                    }

            logger.info("[Chat] Using database result")

            columns = db_result.get("columns", [])
            rows = db_result.get("raw_data", [])

            is_auction_data = self._is_auction_query(user_message, columns)

            if is_auction_data:
                formatted_answer = self._format_auction_data(rows)

                viz_result = await self.mcp_client.create_visualization(
                    data=rows,
                    query=user_message,
                    chart_type="table"
                )

                response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=formatted_answer,
                    sql_query=db_result.get("sql_query"),
                    data=rows,
                    source="database",
                    visualization_type="table",
                    visualization_data=viz_result.get("visualization"),
                    response_time_ms=response_time
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": formatted_answer,
                    "source": "database",
                    "data_type": "auction",
                    "columns": columns,
                    "data": rows,
                    "row_count": len(rows),
                    "visualization_type": "table",
                    "visualization": viz_result.get("visualization"),
                    "sql_query": db_result.get("sql_query"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "response_time_ms": response_time
                }

            suggested = db_result.get("suggested_visualization", {})
            candidates = suggested.get("candidates", ["table"])

            llm_out = await self._summarize_and_choose_viz(
                question=user_message,
                columns=columns,
                rows=rows,
                candidates=candidates
            )

            chosen_type = llm_out["visualization_type"]

            viz_result = await self.mcp_client.create_visualization(
                data=rows,
                query=user_message,
                chart_type=chosen_type
            )

            if not viz_result.get("success"):
                viz_result = {"visualization": None, "visualization_type": chosen_type}

            response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=llm_out["summary"],
                sql_query=db_result.get("sql_query"),
                data=rows,
                source="database",
                visualization_type=chosen_type,
                visualization_data=viz_result.get("visualization"),
                response_time_ms=response_time
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": llm_out["summary"],
                "source": "database",
                "columns": columns,
                "data": rows,
                "row_count": len(rows),
                "suggested_visualization": suggested,
                "visualization_type": chosen_type,
                "visualization": viz_result.get("visualization"),
                "sql_query": db_result.get("sql_query"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "response_time_ms": response_time
            }

        # Database query ran successfully but returned no rows
        # This means the data simply does not exist right now - do NOT fall back to web search,
        # because the question is about live system data that the web cannot answer accurately.
        if db_result.get("success"):
            logger.info("[Chat] Database query returned no results - informing user, skipping web search")
            response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            no_data_message = (
                "There are currently no records in the database that match your query. "
                "This information comes from our live system, so it may not be available at this time. "
                "Please check back later or try a different query."
            )

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=no_data_message,
                source="database",
                response_time_ms=response_time
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": no_data_message,
                "source": "database",
                "row_count": 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "response_time_ms": response_time
            }

        # Database query failed (timeout, SQL generation failure, etc.).
        # For knowledge-style tea questions, fall back to web search.
        db_error_text = " ".join([
            str(db_result.get("error", "")),
            str(db_result.get("message", "")),
        ]).lower()
        is_empty_sql_generation = (
            "empty query" in db_error_text
            or "generated an empty" in db_error_text
            or (not str(db_result.get("generated_sql", "")).strip())
        )

        question_lower = user_message.lower()
        knowledge_markers = [
            "tell me",
            "what is",
            "about",
            "industry",
            "history",
            "market",
            "global",
            "export",
            "overview",
            "explain",
        ]
        looks_like_knowledge_query = any(marker in question_lower for marker in knowledge_markers)
        platform_data_markers = [
            "auction",
            "auctions",
            "scheduled",
            "live",
            "history",
            "seller",
            "buyer",
            "bid",
            "this platform",
            "our platform",
            "database",
            "system",
        ]
        looks_like_platform_data_query = any(marker in question_lower for marker in platform_data_markers)

        if (is_empty_sql_generation or looks_like_knowledge_query) and not looks_like_platform_data_query:
            logger.warning("[Chat] Database failed; falling back to web search for knowledge-style query")
            search_result = await self.mcp_client.search_web(user_message)

            if search_result.get("success"):
                response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
                answer = search_result.get("answer", "")

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="web",
                    search_results=search_result.get("results", []),
                    response_time_ms=response_time,
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "web",
                    "search_results": search_result.get("results", []),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "response_time_ms": response_time,
                }

        logger.warning("[Chat] Database query failed - returning error response")
        response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        fallback_message = (
            "I was unable to retrieve data from the database at this time. "
            "Please try again later."
        )

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=fallback_message,
            source="error"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": fallback_message,
            "source": "error",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "response_time_ms": response_time
        }

    def _get_followup_visualization_context(
        self,
        user_message: str,
        conversation_id: UUID,
    ) -> Optional[Dict[str, Any]]:
        question = user_message.lower().strip()

        chart_terms = ["chart", "graph", "plot", "visual", "pie", "bar", "line", "table"]
        if not any(term in question for term in chart_terms):
            return None

        reference_terms = [
            "above",
            "previous",
            "earlier",
            "same",
            "that",
            "this",
            "comparison",
            "result",
        ]
        if not any(term in question for term in reference_terms):
            return None

        recent_messages = self.message_repo.get_recent_by_conversation(conversation_id, limit=15)
        for msg in recent_messages:
            if msg.role != "assistant":
                continue
            if msg.source not in {"database", "hybrid"}:
                continue

            data_rows = msg.get_data()
            if not data_rows:
                continue

            columns = list(data_rows[0].keys()) if isinstance(data_rows[0], dict) else []
            return {
                "rows": data_rows,
                "columns": columns,
                "sql_query": msg.sql_query,
            }

        return None

    def _is_auction_query(self, query: str, columns: list) -> bool:
        """Detect if query results are auction data."""
        query_lower = query.lower()

        auction_keywords = ["auction", "auctions", "bid", "bidding", "live auction", "scheduled auction"]
        has_auction_keyword = any(keyword in query_lower for keyword in auction_keywords)

        auction_columns = {
            "auction_id", "auction_name", "grade", "quantity",
            "origin", "base_price", "status", "start_time"
        }
        has_auction_columns = len(auction_columns.intersection(set(columns))) >= 4

        return has_auction_keyword or has_auction_columns

    def _format_auction_data(self, rows: list) -> str:
        """Format auction data for better display."""
        if not rows:
            return "No auctions found."

        response = f"**Found {len(rows)} auction(s):**\n\n"

        for idx, auction in enumerate(rows, 1):
            status_emoji = {
                "Live": "Live",
                "Scheduled": "Scheduled",
                "History": "History"
            }.get(auction.get("status", ""), "Auction")

            response += f"{status_emoji} **Auction #{idx}**\n"
            response += "━━━━━━━━━━━━━━━━━━━━\n"

            if "auction_name" in auction:
                response += f"**Name:** {auction['auction_name']}\n"
            if "grade" in auction:
                response += f"**Grade:** {auction['grade']}\n"
            if "quantity" in auction:
                response += f"**Quantity:** {auction['quantity']} kg\n"
            if "origin" in auction:
                response += f"**Origin:** {auction['origin']}\n"
            if "base_price" in auction and auction.get("base_price") is not None:
                try:
                    response += f"**Starting Price:** LKR {float(auction['base_price']):,.2f}\n"
                except (TypeError, ValueError):
                    response += f"**Starting Price:** LKR {auction['base_price']}\n"
            if "status" in auction:
                response += f"**Status:** {auction['status']}\n"
            if "start_time" in auction:
                response += f"**Start Time:** {auction['start_time']}\n"
            if "duration" in auction:
                response += f"**Duration:** {format_duration_minutes(auction['duration'])}\n"
            if "description" in auction and auction["description"]:
                response += f"**Description:** {auction['description']}\n"
            if "seller_brand" in auction:
                response += f"**Seller:** {auction['seller_brand']}\n"
            if "estate_name" in auction:
                response += f"**Estate:** {auction['estate_name']}\n"
            if "auction_id" in auction:
                response += f"_ID: {auction['auction_id']}_\n"

            response += "\n"

        return response.strip()

    async def _handle_hybrid_query(
        self,
        user_message: str,
        conversation: Conversation
    ) -> Dict[str, Any]:
        """Handle questions that need both data and knowledge"""

        logger.info("[Chat] Handling as HYBRID query")

        # Get both database and web results
        db_task = self.mcp_client.query_database(user_message)
        web_task = self.mcp_client.search_web(user_message)

        # Run in parallel
        db_result, web_result = await asyncio.gather(db_task, web_task)

        # Combine results
        combined_answer = ""

        if web_result.get("success"):
            combined_answer += web_result.get("answer", "") + "\n\n"

        if db_result.get("success") and db_result.get("has_data"):
            rows = db_result.get("raw_data", [])
            columns = db_result.get("columns", [])

            # Add data summary
            combined_answer += "From our records:\n"
            combined_answer += f"Found {len(rows)} entries with {', '.join(columns)}"

            # Create visualization
            viz_result = await self.mcp_client.create_visualization(
                data=rows,
                query=user_message
            )

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=combined_answer,
                sql_query=db_result.get("sql_query"),
                data=rows,
                source="hybrid",
                visualization_type=viz_result.get("visualization_type"),
                visualization_data=viz_result.get("visualization"),
                search_results=web_result.get("results", [])
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": combined_answer,
                "source": "hybrid",
                "data": rows,
                "search_results": web_result.get("results", []),
                "visualization": viz_result.get("visualization")
            }

        # Only web result available
        if web_result.get("success"):
            answer = web_result.get("answer", "")
            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="web",
                search_results=web_result.get("results", [])
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "web",
                "search_results": web_result.get("results", [])
            }

        # Fallback
        return {
            "success": False,
            "answer": "I couldn't find information to answer your question."
        }

    async def _verify_data_relevance(
        self,
        question: str,
        data: list,
        columns: list
    ) -> bool:
        """
        Use LLM to verify if database results actually answer the question.

        Returns True if data is relevant, False otherwise.
        """
        if not data or not columns:
            return False

        try:
            from langchain_core.messages import SystemMessage, HumanMessage

            # Take sample of data
            sample = data[:3] if len(data) > 3 else data

            system = SystemMessage(content=(
                "You are a data relevance checker. "
                "Determine if database results answer the user's question. "
                "Reply ONLY with 'yes' or 'no'."
            ))

            human = HumanMessage(content=f"""
                    Question: {question}

                    Database returned {len(data)} rows with columns: {columns}
                    Sample data: {sample}

                    Does this data answer the question?

                    Examples:
                    Q: "What are health benefits?" Data: [tea standards] → no
                    Q: "How many customers?" Data: [count: 50] → yes
                    Q: "Show me prices" Data: [prices, dates] → yes
                    Q: "How to brew tea?" Data: [purchase records] → no
                    Q: "What is BOPF?" Data: [BOPF, price, quantity] → no (needs explanation, not data)

                    Answer (yes/no):
                """)

            response = await self.llm.ainvoke([system, human])
            result = response.content.strip().lower()

            is_relevant = "yes" in result
            logger.info(f"[Relevance] Question: '{question[:40]}' | Relevant: {is_relevant}")

            return is_relevant

        except Exception as e:
            logger.error(f"[Relevance] Check failed: {e}, assuming relevant")
            # On error, assume relevant (don't block legitimate queries)
            return True

    def _might_be_knowledge_query(self, question: str) -> bool:
        """
        Check if question might be asking for explanations/knowledge
        rather than data, despite being classified as database query.

        Only returns True for ambiguous cases where relevance check is needed.
        """
        q = question.lower().strip()

        if any(q.startswith(signal) for signal in ["what is", "what are", "why", "how does"]):
            logger.debug(f"[MightBeKnowledge] '{question[:40]}' - TRUE (knowledge pattern)")
            return True

        if "compare" in q:
            data_keywords = ["price", "average", "count", "number", "sales", "revenue", "quantity"]
            if any(keyword in q for keyword in data_keywords):
                logger.debug(f"[MightBeKnowledge] '{question[:40]}' - FALSE (data comparison)")
                return False  # Data comparison, no LLM check needed

        # Definitely data queries
        data_patterns = [
            "show me",
            "list",
            "how many",
            "how much",
            "get all",
            "find",
        ]
        if any(q.startswith(pattern) for pattern in data_patterns):
            logger.debug(f"[MightBeKnowledge] '{question[:40]}' - FALSE (clear data pattern)")
            return False

        # No clear signals either way
        logger.debug(f"[MightBeKnowledge] '{question[:40]}' - FALSE (no knowledge signals)")
        return False

    def _is_echoed_response(self, message: str) -> bool:
        """Detect if user accidentally sent AI's response back"""
        msg_lower = message.lower().strip()

        # Never treat explicit user intents as echoes.
        user_intent_markers = [
            "create a tea auction",
            "auction listing",
            "listings for",
            "starting at",
            "including this description",
            "update auction",
            "delete auction",
        ]
        if any(marker in msg_lower for marker in user_intent_markers):
            return False

        # Starts with AI response patterns
        ai_patterns = [
            "based on recent listings",
            "here are some specific",
            "the provided data",
            "according to the data",
            "the dataset shows",
            "in summary",
            "based on the data",
        ]

        pattern_hits = sum(1 for pattern in ai_patterns if pattern in msg_lower)

        # Contains multiple price listings
        import re
        price_matches = re.findall(r"Rs\.\s*\d+", message)

        # Echo detection should be conservative to avoid false positives on long user prompts.
        # Require clear AI-like signals rather than message length alone.
        if pattern_hits >= 2:
            return True

        if pattern_hits >= 1 and len(price_matches) >= 3:
            return True

        return False

    async def _summarize_and_choose_viz(
        self,
        question: str,
        columns: list,
        rows: list,
        candidates: list
    ) -> Dict[str, Any]:
        """Use Gemini to summarize DB results and choose visualization type"""

        # Check if user explicitly requested a chart type
        question_lower = question.lower()

        chart_keywords = {
            "pie": ["pie", "percentage", "proportion", "share", "distribution", "ratio"],
            "bar": ["bar", "bar chart", "compare", "comparison"],
            "line": ["line", "trend", "over time", "timeline", "history", "monthly", "yearly", "annual"],
            "table": ["table", "list", "show all", "details", "detail"],
        }

        explicit_type = None
        for chart_type, keywords in chart_keywords.items():
            if any(keyword in question_lower for keyword in keywords):
                explicit_type = chart_type
                break

        # If user explicitly requested a type, use it directly
        if explicit_type:
            try:
                from langchain_core.messages import SystemMessage, HumanMessage

                system = SystemMessage(content=(
                    "You are TeaBlendAI, an analytics assistant for Sri Lankan tea data.\n"
                    "Summarize the data in 4-5 sentences. Be accurate and grounded in the data.\n"
                    "Return STRICT JSON only: {\"summary\": \"...\"}"
                ))

                sample_rows = rows[:10]
                human = HumanMessage(content=json.dumps({
                    "question": question,
                    "columns": columns,
                    "sample_rows": sample_rows,
                }))

                resp = await self.llm.ainvoke([system, human])
                raw = resp.content.strip()

                if "```" in raw:
                    raw = raw.split("```")[1].replace("json", "").strip()

                data = json.loads(raw)
                summary = data.get("summary", "")
                if not summary:
                    summary = f"Found {len(rows)} records."

            except Exception as e:
                logger.error(f"[LLM] Summary failed: {e}")
                summary = f"Found {len(rows)} records with columns: {', '.join(columns)}."

            logger.info(f"[VIZ] User requested '{explicit_type}' -> using it directly")
            return {
                "summary": summary,
                "visualization_type": explicit_type
            }

        # No explicit request -> let LLM pick from candidates
        try:
            from langchain_core.messages import SystemMessage, HumanMessage

            system = SystemMessage(content=(
                "You are TeaBlendAI, an analytics assistant for Sri Lankan tea data.\n"
                "You must be accurate and grounded ONLY in the provided dataset.\n"
                "Choose the most appropriate chart type from the candidates.\n"
                "Prefer BAR for comparing categories, LINE for time trends, "
                "PIE only for share/proportion questions, TABLE for raw data.\n"
                "Never invent values.\n"
                "Return STRICT JSON only: {\"summary\": \"...\", \"visualization_type\": \"...\"}"
            ))

            sample_rows = rows[:10]
            human = HumanMessage(content=json.dumps({
                "question": question,
                "columns": columns,
                "sample_rows": sample_rows,
                "chart_candidates": candidates,
                "instruction": (
                    "Return JSON with exactly two fields: "
                    "summary (4-5 sentences describing the data) "
                    "and visualization_type (one of the chart_candidates)."
                )
            }))

            resp = await self.llm.ainvoke([system, human])
            raw = resp.content.strip()

            if "```" in raw:
                raw = raw.split("```")[1].replace("json", "").strip()

            data = json.loads(raw.strip())
            summary = data.get("summary", "")
            chosen = data.get("visualization_type", "")

            if chosen not in ["table", "bar", "line", "pie"]:
                chosen = candidates[0] if candidates else "table"

            if not summary:
                summary = f"Found {len(rows)} records with columns: {', '.join(columns)}."

            return {"summary": summary, "visualization_type": chosen}

        except Exception as e:
            logger.error(f"[LLM] Summarization failed: {e}", exc_info=True)

            row_count = len(rows)
            chosen = candidates[0] if candidates else "table"

            if row_count == 1 and rows:
                values = ", ".join(f"{k}: {v}" for k, v in list(rows[0].items())[:5])
                summary = f"Result: {values}"
            else:
                summary = f"Found {row_count} records. Columns: {', '.join(columns[:5])}."

            return {"summary": summary, "visualization_type": chosen}
        
        
# HELPER FUNCTIONS

def get_chat_service(
    conversation_repo: ConversationRepository,
    message_repo: ChatMessageRepository,
    mcp_client: MCPClientManager
) -> ChatService:
    """Factory function to create chat service"""
    return ChatService(conversation_repo, message_repo, mcp_client)
