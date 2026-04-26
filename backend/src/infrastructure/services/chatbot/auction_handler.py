"""
Auction Handler

Handles auction management operations in chat service.
Multi-turn conversation flow for creating/updating/deleting auctions.
"""

import logging
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from src.domain.models.conversation import Conversation
from src.domain.models.message import ChatMessage
from src.domain.repositories.chatbot.chat_repository import ChatMessageRepositoryInterface
from src.infrastructure.services.chatbot.conversation_state_manager import state_manager
from src.infrastructure.services.chatbot.mcp_client_manager import MCPClientManager
from src.infrastructure.services.chatbot.mcp.tea_auction.parameter_extractor import parameter_extractor
from src.infrastructure.services.chatbot.mcp.tea_auction.auction_fields import (
    CREATE_AUCTION_FIELDS,
    UPDATE_AUCTION_FIELDS,
    DELETE_AUCTION_FIELDS,
    get_field_question,
    format_datetime_for_display
)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from src.config import get_settings

logger = logging.getLogger(__name__)


class AuctionHandler:
    """
    Handles auction-related chat operations.
    
    Manages multi-turn flows for:
    - Creating auctions
    - Updating auctions
    - Deleting auctions
    - Scheduling auctions
    """
    
    def __init__(
        self,
        message_repo: ChatMessageRepositoryInterface,
        mcp_client: MCPClientManager
    ):
        self.message_repo = message_repo
        self.mcp_client = mcp_client

    @staticmethod
    def _get_flow_reference_time(state: Any) -> datetime:
        """Get create-flow start time used for start_time minimum validation."""
        flow_started_at = state.partial_data.get("_flow_started_at") if state else None
        if isinstance(flow_started_at, str):
            try:
                parsed_time = datetime.fromisoformat(flow_started_at)
                return parsed_time if parsed_time.tzinfo is not None else parsed_time.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        if state and getattr(state, "created_at", None):
            created_at = state.created_at
            return created_at if created_at.tzinfo is not None else created_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc)

    def _prompt_for_custom_description(
        self,
        conversation: Conversation,
        state: Any,
        intro: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ask the user to type a custom description."""
        state.partial_data["_awaiting_custom_description_input"] = True
        state_manager.set_confirmation_pending(conversation.conversation_id, False)

        lead = intro.strip() + "\n\n" if intro else ""
        answer = f"""
        {lead}Please type the custom description you'd like to use for this auction.
        """.strip()

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "state": "awaiting_custom_description",
            "message_type": "text",
        }

    @staticmethod
    def _extract_inline_description(user_message: str) -> Optional[str]:
        """Extract user-provided inline description blocks from a single message."""
        if not user_message:
            return None

        marker_patterns = [
            r"\b(?:including|include|with)\s+(?:this\s+)?description\b\s*[:\-]?\s*",
            r"\bdescription\b\s*(?::|is|-)\s*",
        ]

        for marker_pattern in marker_patterns:
            marker_match = re.search(marker_pattern, user_message, re.IGNORECASE)
            if not marker_match:
                continue

            description = user_message[marker_match.end():].strip()
            description = description.strip('"').strip("'").strip()
            if description:
                return description

        return None

    @staticmethod
    def _contains_choice(message: str, choices: List[str]) -> bool:
        """Return True when any choice appears as a whole word/phrase."""
        normalized = re.sub(r"\s+", " ", (message or "").lower()).strip()
        if not normalized:
            return False

        for choice in choices:
            token = choice.lower().strip()
            if not token:
                continue

            if " " in token:
                if re.search(rf"(?<!\w){re.escape(token)}(?!\w)", normalized):
                    return True
            else:
                if re.search(rf"\b{re.escape(token)}\b", normalized):
                    return True

        return False

    async def _refine_auction_description(
        self,
        auction_data: Dict[str, Any],
        user_description: Optional[str] = None,
    ) -> str:
        """Generate or refine a concise plain-text auction description."""

        settings = get_settings()
        llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.6,
        )

        grade = str(auction_data.get("grade", "tea")).strip()
        quantity = auction_data.get("quantity", 0)
        origin = str(auction_data.get("origin", "Sri Lanka")).strip()
        price = auction_data.get("base_price", 0)
        start_time = auction_data.get("start_time", "")
        duration = auction_data.get("duration", "")

        system = SystemMessage(
            content=(
                "You are a professional tea auction copywriter. "
                "Your task is to create or refine a tea description based on user input.\n\n"

                "Rules:\n"
                "- If the user provides a description, improve it while keeping the original meaning.\n"
                "- If no description is provided, generate a simple, clear one.\n"
                "- Output MUST be ONLY the final description.\n"
                "- Do NOT include labels, headings, bullet points, or extra text.\n"
                "- Keep the output in a maximum of 2 short sentences.\n\n"

                "Writing style:\n"
                "- Very simple, clear, and human-friendly language\n"
                "- Easy for any buyer to understand\n"
                "- Focus only on key points: quality, aroma, flavor, origin\n"
                "- Avoid complex or marketing-heavy wording\n"
            )
        )

        user_context = [
            f"Tea Grade: {grade}",
            f"Quantity: {quantity} kg",
            f"Origin: {origin}",
            f"Starting Price: LKR {price:,}",
            f"Start Time: {start_time}",
            f"Duration: {duration}",
        ]
        if user_description:
            user_context.append(f"User Description: {user_description.strip()}")

        human = HumanMessage(
            content=(
                "Create the auction listing using these details:\n\n"
                + "\n".join(f"- {line}" for line in user_context)
                + "\n\nReturn only the refined description text."
            )
        )

        try:
            response = await llm.ainvoke([system, human])
            refined = response.content.strip()
            if refined.startswith("```"):
                refined = refined.strip("`\n")
            logger.info("[AuctionHandler] Refined auction description: %s...", refined[:80])
            return refined
        except Exception as e:
            logger.error("[AuctionHandler] Description refinement failed: %s", e)
            return (
                f"Premium {grade} tea from {origin}, offered as a {quantity} kg lot, presents a rich aroma and a balanced flavor profile suited for discerning buyers. "
                f"This lot is positioned with a starting price of LKR {price:,} and is well-suited for auction participants seeking consistent quality and dependable cup character."
            )
    
    async def handle_auction_management(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for auction management.
        
        Args:
            user_message: User's message
            conversation: Conversation object
            user_id: User ID (when auth is implemented)
            user_role: User role (when auth is implemented)
        
        Returns:
            Response dictionary
        """
        action = parameter_extractor.detect_action_type(user_message)
        state = state_manager.get_state(conversation.conversation_id)

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to manage auctions."
            )

        normalized_role = (user_role or "").strip().lower()

        # Seller-only role validation for chatbot auction operations.
        # Reject all auction management actions for non-seller users.
        if normalized_role != "seller":
            if state is not None:
                state_manager.delete_state(conversation.conversation_id)
            return self._rejection_response(
                conversation,
                "Only sellers can create, update, or delete auctions. Please log in with a seller account."
            )
        
        if state is None:
            # New auction operation - detect action
            return await self._start_new_operation(user_message, conversation, user_id)
        else:
            # Continue existing operation
            return await self._continue_operation(user_message, conversation, state, user_id)
    
    async def _start_new_operation(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Start a new auction operation (create/update/delete)"""
        
        # Detect action type
        action = parameter_extractor.detect_action_type(user_message)
        
        logger.info(f"[AuctionHandler] Starting {action} operation")
        
        if action == "create":
            return await self._handle_create_start(user_message, conversation, user_id)
        
        elif action == "update":
            return await self._handle_update_start(user_message, conversation, user_id)
        
        elif action == "delete":
            return await self._handle_delete_start(user_message, conversation, user_id)
        
        else:
            # Unknown action
            return self._help_response(conversation)
    
    async def _handle_create_start(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Start auction creation flow"""
        
        # Extract any parameters from initial message
        required_fields = CREATE_AUCTION_FIELDS["required"].copy()
        flow_started_at = datetime.now(timezone.utc)
        
        extracted = await parameter_extractor.extract_parameters(
            user_message,
            required_fields,
            reference_time=flow_started_at,
        )

        # Check for validation errors
        validation_errors = extracted.pop("_validation_errors", None)
        weekday_confirmation_required = bool(extracted.pop("_weekday_confirmation_required", False))
        weekday_confirmation_expression = extracted.pop("_weekday_confirmation_expression", "")
        weekday_confirmation_time_12h = extracted.pop("_weekday_confirmation_time_12h", "")

        inline_description = self._extract_inline_description(user_message)
        if inline_description:
            extracted["description"] = inline_description
            extracted["_description_decision_made"] = True
            logger.info("[AuctionHandler] Extracted inline description from initial message")

        # Detect whether the user signalled they want a description in their initial message
        _desc_intent_keywords = [
            'with a description', 'add a description', 'include a description',
            'generate a description', 'create a description', 'with description',
            'add description', 'want a description', 'want description',
            'need a description', 'description please', 'please add description',
            'i want to add a description', 'i want description',
        ]
        wants_description = (not inline_description) and any(
            kw in user_message.lower() for kw in _desc_intent_keywords
        )

        # Create state first so the flow continues even when some fields are invalid
        state = state_manager.create_state(
            conversation_id=conversation.conversation_id,
            state_type="auction_management",
            action="create",
            required_fields=required_fields,
            optional_fields=CREATE_AUCTION_FIELDS["optional"],
            initial_data={
                **extracted,
                "_flow_started_at": flow_started_at.isoformat(),
                **({"_auto_generate_description": True} if wants_description else {}),
            }
        )

        if validation_errors:
            error_messages = []
            for err in validation_errors:
                error_messages.append(f"❌ **{err['field'].replace('_', ' ').title()}**: {err['error']}")

            invalid_fields = [err.get("field") for err in validation_errors if err.get("field")]
            next_field = None
            for field in invalid_fields:
                if field in required_fields:
                    next_field = field
                    break
            if not next_field:
                missing = state.get_missing_required_fields()
                next_field = missing[0] if missing else required_fields[0]

            question = get_field_question(next_field)

            field_metadata = {
                "field_name": next_field,
                "field_type": self._get_field_type(next_field),
                "options": self._get_field_options(next_field),
                "validation": self._get_field_validation(next_field)
            }

            answer = "\n\n".join(error_messages)
            answer += f"\n\n{question}"

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management",
                metadata=field_metadata
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "state": "collecting_parameters",
                "prompt_type": "field_input",
                "field_metadata": field_metadata,
                "validation_errors": validation_errors,
                "message_type": "validation_error",
                "validation_payload": {
                    "type": "validation_error",
                    "flow_id": str(conversation.conversation_id),
                    "field_errors": validation_errors,
                    "next_field": next_field,
                },
                "input_request": {
                    "type": "input_request",
                    "flow_id": str(conversation.conversation_id),
                    "field_name": field_metadata.get("field_name"),
                    "field_type": field_metadata.get("field_type"),
                    "options": field_metadata.get("options", []),
                    "validation": field_metadata.get("validation", {}),
                },
            }
        
        logger.info(f"[AuctionHandler] Extracted from initial: {list(extracted.keys())}")

        if weekday_confirmation_required and extracted.get("start_time"):
            return self._ask_for_weekday_start_time_confirmation(
                conversation=conversation,
                state=state,
                resolved_start_time=extracted.get("start_time"),
                expression=weekday_confirmation_expression,
                display_time_12h=weekday_confirmation_time_12h,
            )
        
        # Check what's missing
        missing = state.get_missing_required_fields()
        
        if not missing:
            # Got everything! Show confirmation
            return await self._generate_confirmation(conversation, state)
        else:
            # Ask for next missing field
            return self._ask_for_field(conversation, missing[0], state)
    
    async def _continue_operation(
        self,
        user_message: str,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Continue an ongoing operation"""

        if state.action == "update" and not state.confirmation_pending:
            extracted = await parameter_extractor.extract_parameters(
                user_message,
                UPDATE_AUCTION_FIELDS["optional"],
                context=state.partial_data,
                reference_time=self._get_flow_reference_time(state),
            )

            extracted.pop("_validation_errors", None)
            extracted.pop("_weekday_confirmation_required", None)
            extracted.pop("_weekday_confirmation_expression", None)
            extracted.pop("_weekday_confirmation_time_12h", None)

            updates = {
                key: value
                for key, value in extracted.items()
                if key in set(UPDATE_AUCTION_FIELDS["optional"])
            }

            if not updates:
                answer = (
                    "Please tell me what to update (price, quantity, origin, start time, duration, description, or grade)."
                )
                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="auction_management"
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "auction_management",
                    "state": "collecting_update_parameters",
                    "message_type": "text",
                }

            state_manager.update_state(conversation.conversation_id, updates)
            return await self._generate_update_confirmation(conversation, state)

        if state.partial_data.get('_awaiting_description_confirmation'):
            return await self._handle_confirmation(user_message, conversation, state, user_id)

        # Check if user is confirming
        if state.confirmation_pending:
            return await self._handle_confirmation(user_message, conversation, state, user_id)

        if state.partial_data.get('_awaiting_custom_description_input'):
            state.partial_data.pop('_awaiting_custom_description_input', None)
            custom_description = user_message.strip()

            if not custom_description:
                return self._prompt_for_custom_description(
                    conversation,
                    state,
                    intro="Description cannot be empty."
                )

            refined_description = await self._refine_auction_description(
                state.partial_data,
                user_description=custom_description,
            )
            state.partial_data['description'] = refined_description
            state.partial_data['_description_decision_made'] = True
            state_manager.update_state(conversation.conversation_id, {'description': refined_description})
            logger.info("[AuctionHandler] Custom description captured")
            return await self._generate_confirmation(conversation, state)

        inline_description = self._extract_inline_description(user_message)
        if inline_description and state.action == "create":
            state.partial_data.pop('_needs_description_generation', None)
            state.partial_data.pop('_auto_generate_description', None)
            state.partial_data['description'] = inline_description
            state.partial_data['_description_decision_made'] = True
            state_manager.update_state(
                conversation.conversation_id,
                {
                    'description': inline_description,
                    '_description_decision_made': True,
                }
            )
            logger.info("[AuctionHandler] Captured inline description during create flow")
        
        # Check if we need to handle description generation choice
        if state.partial_data.get('_needs_description_generation'):
            return await self._handle_description_choice(user_message, conversation, state)

        # Extract parameters from current message
        missing_fields = state.get_missing_required_fields()
        
        if missing_fields:
            # Try to extract the next missing field
            extracted = await parameter_extractor.extract_parameters(
                user_message,
                missing_fields,
                context=state.partial_data,
                reference_time=self._get_flow_reference_time(state),
            )

            # Check for validation errors
            validation_errors = extracted.pop("_validation_errors", None)
            weekday_confirmation_required = bool(extracted.pop("_weekday_confirmation_required", False))
            weekday_confirmation_expression = extracted.pop("_weekday_confirmation_expression", "")
            weekday_confirmation_time_12h = extracted.pop("_weekday_confirmation_time_12h", "")

            if validation_errors:
                error_messages = []
                for err in validation_errors:
                    error_messages.append(f"**{err['field'].replace('_', ' ').title()}**: {err['error']}")

                invalid_fields = [err.get("field") for err in validation_errors if err.get("field")]
                next_field = None
                for field in invalid_fields:
                    if field in missing_fields:
                        next_field = field
                        break
                if not next_field:
                    next_field = missing_fields[0]

                question = get_field_question(next_field)

                field_metadata = {
                    "field_name": next_field,
                    "field_type": self._get_field_type(next_field),
                    "options": self._get_field_options(next_field),
                    "validation": self._get_field_validation(next_field)
                }

                answer = "\n\n".join(error_messages)
                answer += f"\n\n{question}"

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="auction_management",
                    metadata=field_metadata
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "auction_management",
                    "state": "collecting_parameters",
                    "prompt_type": "field_input",
                    "field_metadata": field_metadata,
                    "validation_errors": validation_errors,
                    "message_type": "validation_error",
                    "validation_payload": {
                        "type": "validation_error",
                        "flow_id": str(conversation.conversation_id),
                        "field_errors": validation_errors,
                        "next_field": next_field,
                    },
                    "input_request": {
                        "type": "input_request",
                        "flow_id": str(conversation.conversation_id),
                        "field_name": field_metadata.get("field_name"),
                        "field_type": field_metadata.get("field_type"),
                        "options": field_metadata.get("options", []),
                        "validation": field_metadata.get("validation", {}),
                    },
                }
            
            # Update state
            if extracted:
                state_manager.update_state(conversation.conversation_id, extracted)
                logger.info(f"[AuctionHandler] Updated with: {list(extracted.keys())}")

            if weekday_confirmation_required and extracted.get("start_time"):
                return self._ask_for_weekday_start_time_confirmation(
                    conversation=conversation,
                    state=state,
                    resolved_start_time=extracted.get("start_time"),
                    expression=weekday_confirmation_expression,
                    display_time_12h=weekday_confirmation_time_12h,
                )
            
            # Check again what's missing
            still_missing = state.get_missing_required_fields()
            
            if not still_missing:
                # Complete! Show confirmation
                return await self._generate_confirmation(conversation, state)
            else:
                # Still need more fields
                return self._ask_for_field(conversation, still_missing[0], state)
        else:
            # Shouldn't reach here, but handle gracefully
            return await self._generate_confirmation(conversation, state)
    
    async def _handle_description_choice(
        self,
        user_message: str,
        conversation: Conversation,
        state: Any
    ) -> Dict[str, Any]:
        """Handle user's choice about auto-generated description"""

        msg_lower = user_message.lower().strip()

        # Remove the flag
        state.partial_data.pop('_needs_description_generation', None)

        inline_description = self._extract_inline_description(user_message)
        if inline_description:
            refined_description = await self._refine_auction_description(
                state.partial_data,
                user_description=inline_description,
            )
            state.partial_data['description'] = refined_description
            state.partial_data['_description_decision_made'] = True
            state.partial_data.pop('_awaiting_description_confirmation', None)
            state_manager.update_state(
                conversation.conversation_id,
                {
                    'description': refined_description,
                    '_description_decision_made': True,
                }
            )
            state_manager.set_confirmation_pending(conversation.conversation_id, False)
            logger.info("[AuctionHandler] User provided inline description at description-choice step")
            return await self._generate_confirmation(conversation, state)

        # Check if user wants auto-generated description
        if self._contains_choice(msg_lower, ['yes', 'y', 'generate', 'create', 'ok']):
            # Generate description
            logger.info("[AuctionHandler] Generating description with Gemini...")

            generated_desc = await self._refine_auction_description(state.partial_data)
        
            # Store the generated description
            state.partial_data['description'] = generated_desc
            state_manager.update_state(conversation.conversation_id, {'description': generated_desc})
            
            # Show generated description and ask for confirmation
            answer = f"""
            I've prepared a description for you:

            {generated_desc}

            Would you like to use this description?
            """.strip()

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)
            
            # Set flag for description confirmation
            state.partial_data['_awaiting_description_confirmation'] = True
            state_manager.set_confirmation_pending(conversation.conversation_id, True)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "state": "awaiting_description_confirmation",
                "message_type": "auction_confirmation",
                "auction_payload": {
                    "type": "auction_confirmation",
                    "flow_id": str(conversation.conversation_id),
                    "subtype": "description_generated_confirmation",
                    "fields": {
                        "description": generated_desc,
                    },
                    "actions": ["confirm", "cancel", "change"],
                }
            }

        elif self._contains_choice(msg_lower, ['no', 'n', 'skip', 'none']):
            # User doesn't want description
            logger.info("[AuctionHandler] User skipped description")
            state.partial_data['description'] = None
            state.partial_data['_description_decision_made'] = True
            state.partial_data.pop('_awaiting_description_confirmation', None)
            state_manager.set_confirmation_pending(conversation.conversation_id, False)

            # Proceed to final confirmation
            return await self._generate_confirmation(conversation, state)

        elif self._contains_choice(msg_lower, ['edit', 'change', 'modify', 'custom']):
            logger.info("[AuctionHandler] User chose to edit description")
            return self._prompt_for_custom_description(conversation, state)

        refined_description = await self._refine_auction_description(
            state.partial_data,
            user_description=user_message,
        )
        state.partial_data['description'] = refined_description
        state.partial_data['_description_decision_made'] = True
        state.partial_data.pop('_awaiting_description_confirmation', None)
        state_manager.update_state(
            conversation.conversation_id,
            {
                'description': refined_description,
                '_description_decision_made': True,
            }
        )
        state_manager.set_confirmation_pending(conversation.conversation_id, False)
        logger.info("[AuctionHandler] Treated freeform response as custom description")
        return await self._generate_confirmation(conversation, state)

    async def _handle_confirmation(
        self,
        user_message: str,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle user's confirmation response"""
        
        msg_lower = user_message.lower().strip()

        # Check if we're confirming the generated description
        if state.partial_data.get('_awaiting_description_confirmation'):
            state.partial_data.pop('_awaiting_description_confirmation', None)
            
            if self._contains_choice(msg_lower, ['yes', 'y', 'use', 'ok']):
                # Keep the generated description, proceed to confirmation
                state.partial_data['_description_decision_made'] = True
                return await self._generate_confirmation(conversation, state)
            
            elif self._contains_choice(msg_lower, ['no', 'n', 'skip']):
                # Remove description, proceed to confirmation
                state.partial_data['description'] = None
                state.partial_data['_description_decision_made'] = True
                state_manager.update_state(conversation.conversation_id, {'description': None})
                return await self._generate_confirmation(conversation, state)
            elif self._contains_choice(msg_lower, ['edit', 'change', 'modify', 'custom']):
                return self._prompt_for_custom_description(conversation, state)
            else:
                # User provided edited description - refine it to match structured format
                refined_description = await self._refine_auction_description(
                    state.partial_data,
                    user_description=user_message,
                )
                state.partial_data['description'] = refined_description
                state.partial_data['_description_decision_made'] = True
                state_manager.update_state(conversation.conversation_id, {'description': refined_description})
                return await self._generate_confirmation(conversation, state)
        
        # Check for affirmative responses
        affirmative = ["yes", "y", "confirm", "ok", "proceed", "correct", "looks good", "yep", "yeah", "create it"]
        negative = ["no", "n", "cancel", "stop", "nope"]
        edit_keywords = ["change", "edit", "modify", "update", "fix", "adjust"]

        # Dedicated confirmation step for weekday-based start time interpretation
        if state.partial_data.get("_weekday_confirmation_pending"):
            if self._contains_choice(msg_lower, edit_keywords):
                state_manager.update_state(conversation.conversation_id, {"_weekday_confirmation_pending": False})
                state_manager.set_confirmation_pending(conversation.conversation_id, False)
                return self._ask_for_field(conversation, "start_time", state)

            if self._contains_choice(msg_lower, negative):
                state_manager.delete_state(conversation.conversation_id)
                answer = "Auction creation cancelled. You can start over anytime!"

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="auction_management"
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "auction_management",
                    "message_type": "text",
                }

            if self._contains_choice(msg_lower, affirmative):
                state_manager.update_state(conversation.conversation_id, {"_weekday_confirmation_pending": False})
                state_manager.set_confirmation_pending(conversation.conversation_id, False)

                still_missing = state.get_missing_required_fields()
                if still_missing:
                    return self._ask_for_field(conversation, still_missing[0], state)
                return await self._generate_confirmation(conversation, state)

            answer = """
                Please confirm if this is correct:
                - Reply **'yes'** to confirm this start time
                - Reply **'no'** to cancel auction creation
                - Reply **'change'** to provide a different start time
            """.strip()

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "state": "awaiting_confirmation",
                "message_type": "auction_confirmation",
                "auction_payload": {
                    "type": "auction_confirmation",
                    "flow_id": str(conversation.conversation_id),
                    "subtype": "start_time_confirmation",
                    "fields": {
                        "start_time": state.partial_data.get("start_time")
                    },
                    "actions": ["confirm", "cancel", "change"],
                }
            }
        
        # Check if user wants to edit something
        if self._contains_choice(msg_lower, edit_keywords):
            # User wants to make changes
            state_manager.set_confirmation_pending(conversation.conversation_id, False)
            
            # Try to extract what they want to change
            extracted = await parameter_extractor.extract_parameters(
                user_message,
                state.required_fields + state.optional_fields,
                context=state.partial_data,
                reference_time=self._get_flow_reference_time(state),
            )
            
            if extracted:
                # Update with new values
                state_manager.update_state(conversation.conversation_id, extracted)
                logger.info(f"[AuctionHandler] User made changes: {list(extracted.keys())}")
                
                # Show updated confirmation
                if state.action == "update":
                    return await self._generate_update_confirmation(conversation, state)
                return await self._generate_confirmation(conversation, state)
            else:
                # Couldn't extract, ask what they want to change
                answer = """
                **I can help you make changes!** Please specify what you'd like to change.

                **For example:**
                - **"Change the price to 7500"**
                - **"Set start time to 2026-03-06 15:00"**
                - **"Change quantity to 500"**

                Or say **'cancel'** to start over.
                """.strip()
                
                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="auction_management"
                )
                self.message_repo.create(assistant_msg)
                
                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "auction_management",
                    "message_type": "text",
                }
        
        # User confirmed
        if self._contains_choice(msg_lower, affirmative):
            # User confirmed - execute the action
            return await self._execute_auction_action(conversation, state, user_id)
        
        # User cancelled
        elif self._contains_choice(msg_lower, negative):
            # User cancelled
            state_manager.delete_state(conversation.conversation_id)
            
            answer = "Auction creation cancelled. You can start over anytime!"
            
            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)
            
            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "message_type": "text",
            }

        else:
            # Unclear response - ask again
            answer = """
            Please confirm:
            - Reply **'yes'** to create the auction
            - Reply **'no'** to cancel
            - Or say what you want to **change** (e.g., "change price to 7500")
            """.strip()

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "message_type": "text",
            }

    def _ask_for_weekday_start_time_confirmation(
        self,
        conversation: Conversation,
        state: Any,
        resolved_start_time: str,
        expression: str,
        display_time_12h: str,
    ) -> Dict[str, Any]:
        """Ask user to confirm interpreted weekday datetime before proceeding."""

        resolved_start_time_display = format_datetime_for_display(resolved_start_time)
        expression_text = expression or f"weekday at {display_time_12h or resolved_start_time_display}"
        confirmation_text = f"""
You asked to schedule the auction on **{expression_text}**.
    That corresponds to **{resolved_start_time_display}**.
Please confirm if this is correct.

- Reply **'yes'** to confirm this start time
- Reply **'no'** to cancel auction creation
- Reply **'change'** to update the start time
        """.strip()

        state_manager.update_state(
            conversation.conversation_id,
            {"_weekday_confirmation_pending": True}
        )
        state_manager.set_confirmation_pending(conversation.conversation_id, True)

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=confirmation_text,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": confirmation_text,
            "source": "auction_management",
            "state": "awaiting_confirmation",
            "message_type": "auction_confirmation",
            "auction_payload": {
                "type": "auction_confirmation",
                "flow_id": str(conversation.conversation_id),
                "subtype": "start_time_confirmation",
                "fields": {
                    "start_time": resolved_start_time,
                    "expression": expression,
                    "display_time_12h": display_time_12h,
                },
                "actions": ["confirm", "cancel", "change"],
            }
        }

    def _ask_for_field(
        self,
        conversation: Conversation,
        field_name: str,
        state: Any
    ) -> Dict[str, Any]:
        """Ask user for a specific field with structured prompt"""
        
        question = get_field_question(field_name)

        field_metadata = {
            "field_name": field_name,
            "field_type": self._get_field_type(field_name),
            "options": self._get_field_options(field_name),
            "validation": self._get_field_validation(field_name)
        }
        
        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=question,
            source="auction_management",
            metadata=field_metadata
        )
        self.message_repo.create(assistant_msg)
        
        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": question,
            "source": "auction_management",
            "state": "collecting_parameters",
            "prompt_type": "field_input",
            "field_metadata": field_metadata,
            "message_type": "input_request",
            "input_request": {
                "type": "input_request",
                "flow_id": str(conversation.conversation_id),
                "field_name": field_metadata.get("field_name"),
                "field_type": field_metadata.get("field_type"),
                "options": field_metadata.get("options", []),
                "validation": field_metadata.get("validation", {}),
            }
        }

    def _get_field_type(self, field_name: str) -> str:
        """Get input type for field"""
        field_types = {
            "grade": "select",
            "quantity": "number",
            "origin": "select",
            "base_price": "number",
            "start_time": "datetime",
            "duration": "number",
            "description": "textarea",
            "auction_id": "text"
        }
        return field_types.get(field_name, "text")

    def _get_field_options(self, field_name: str) -> list:
        """Get options for select fields"""
        from .mcp.tea_auction.auction_fields import TeaGrade, VALID_ORIGINS

        if field_name == "grade":
            return [g.value for g in TeaGrade]
        if field_name == "origin":
            return VALID_ORIGINS
        return []

    def _get_field_validation(self, field_name: str) -> dict:
        """Get validation rules for field"""
        validation = {
            "grade": {
                "required": True,
                "type": "string"
            },
            "quantity": {
                "required": True,
                "type": "number",
                "min": 1,
                "max": 100000
            },
            "origin": {
                "required": True,
                "type": "string"
            },
            "base_price": {
                "required": True,
                "type": "number",
                "min": 1,
                "max": 10000000
            },
            "start_time": {
                "required": True,
                "type": "datetime",
                "min": "now",
                "min_minutes_ahead": 5
            },
            "duration": {
                "required": True,
                "type": "number",
                "min": 1,
                "max": 72,
                "unit": "hours"
            },
            "description": {
                "required": False,
                "type": "string",
                "maxLength": 500
            }
        }
        return validation.get(field_name, {})
    
    async def _generate_confirmation(
        self,
        conversation: Conversation,
        state: Any,
    ) -> Dict[str, Any]:
        """Generate confirmation message with all collected data"""
        
        data = state.partial_data

        # Format start time nicely
        start_time_display = format_datetime_for_display(data.get("start_time", "N/A"))
        duration_display = self._format_duration_hours(
            data.get("duration", "N/A"),
            input_unit=data.get("_duration_input_unit")
        )

        # Check if description is missing
        if not data.get('description') and not data.get('_description_decision_made'):
            if data.get('_auto_generate_description'):
                # User signalled they want a description — generate it immediately
                logger.info("[AuctionHandler] User requested description - auto-generating...")
                state.partial_data.pop('_auto_generate_description', None)

                generated_desc = await self._refine_auction_description(state.partial_data)

                # Store generated description and arm confirmation flow
                state.partial_data['description'] = generated_desc
                state.partial_data['_awaiting_description_confirmation'] = True
                state_manager.update_state(conversation.conversation_id, {'description': generated_desc})
                state_manager.set_confirmation_pending(conversation.conversation_id, True)

                answer = f"""
                I've prepared a description for you:

                {generated_desc}

                Would you like to use this description?
                """.strip()

                assistant_msg = ChatMessage.create_assistant_message(
                    conversation_id=conversation.conversation_id,
                    content=answer,
                    source="auction_management"
                )
                self.message_repo.create(assistant_msg)

                return {
                    "success": True,
                    "conversation_id": conversation.conversation_id,
                    "answer": answer,
                    "source": "auction_management",
                    "state": "awaiting_description_confirmation",
                    "message_type": "auction_confirmation",
                    "auction_payload": {
                        "type": "auction_confirmation",
                        "flow_id": str(conversation.conversation_id),
                        "subtype": "description_generated_confirmation",
                        "fields": {
                            "description": generated_desc,
                        },
                        "actions": ["confirm", "cancel", "change"],
                    }
                }

            state_manager.set_confirmation_pending(conversation.conversation_id, False)
            state.partial_data['_needs_description_generation'] = True

            answer = """
            I notice you haven't provided a description. Would you like me to generate one for you?
                    """.strip()

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)
            
            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "state": "awaiting_description_choice",
                "message_type": "auction_confirmation",
                "auction_payload": {
                    "type": "auction_confirmation",
                    "flow_id": str(conversation.conversation_id),
                    "subtype": "description_generation_choice",
                    "fields": {
                        "grade": data.get("grade"),
                        "quantity": data.get("quantity"),
                        "origin": data.get("origin"),
                        "base_price": data.get("base_price"),
                        "start_time": data.get("start_time"),
                        "duration": data.get("duration"),
                        "description": None,
                    },
                    "display": {
                        "start_time": start_time_display,
                        "duration": duration_display,
                    },
                    "actions": ["confirm", "cancel"],
                }
            }
        
        # Format confirmation message
        confirmation = f"""
            **Please confirm auction details:**

            **Tea Grade:** {data.get('grade', 'N/A')}
            **Quantity:** {data.get('quantity', 'N/A')} kg
            **Origin:** {data.get('origin', 'N/A')}
            **Starting Price:** LKR {data.get('base_price', 'N/A'):,}
            **Start Time:** {start_time_display}
            **Duration:** {duration_display}
            **Description:** {data.get('description', 'None')}

            Click **'yes'** to create this auction, or **'no'** to cancel.
            You can also say what you want to **change** (e.g., "change price to 750000").
        """.strip()
        
        # Mark as waiting for confirmation
        state_manager.set_confirmation_pending(conversation.conversation_id, True)
        
        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=confirmation,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        confirmation_payload = {
            "type": "auction_confirmation",
            "flow_id": str(conversation.conversation_id),
            "fields": {
                "grade": data.get("grade"),
                "quantity": data.get("quantity"),
                "origin": data.get("origin"),
                "base_price": data.get("base_price"),
                "start_time": data.get("start_time"),
                "duration": data.get("duration"),
                "description": data.get("description"),
            },
            "display": {
                "start_time": start_time_display,
                "duration": duration_display,
            },
            "actions": ["confirm", "cancel", "change"],
        }
        
        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": confirmation,
            "source": "auction_management",
            "state": "awaiting_confirmation",
            "message_type": "auction_confirmation",
            "auction_payload": confirmation_payload,
        }
    
    async def _execute_auction_action(
        self,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Execute the auction action (create/update/delete)"""

        if state.action == "create":
            return await self._execute_create_auction(conversation, state, user_id)
        if state.action == "update":
            return await self._execute_update_auction(conversation, state, user_id)
        if state.action == "delete":
            return await self._execute_delete_auction(conversation, state, user_id)

        return self._rejection_response(
            conversation,
            f"Action '{state.action}' not yet implemented"
        )

    async def _execute_create_auction(
        self,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Execute auction creation via MCP"""

        data = state.partial_data

        logger.info("[AuctionHandler] Creating auction via MCP")
        logger.info(f"[AuctionHandler] Data: {data}")

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to create auctions."
            )

        result = await self.mcp_client.create_auction(
            user_id=str(user_id),
            grade=data["grade"],
            quantity=int(data["quantity"]),
            origin=data["origin"],
            base_price=float(data["base_price"]),
            start_time=data["start_time"],
            duration=int(data["duration"]),
            description=data.get("description")
        )

        state_manager.delete_state(conversation.conversation_id)

        if result.get("status") == "success":
            auction_id = result.get("auction_id", "Unknown")
            custom_auction_id = result.get("custom_auction_id") or "N/A"
            duration_display = self._format_duration_hours(
                data.get("duration", "N/A"),
                input_unit=data.get("_duration_input_unit")
            )
            description_line = ""
            if data.get("description"):
                description_line = f"\n- **Description:** {data['description']}"

            answer = f"""
**The auction was successfully created.**

**Auction ID:** {auction_id}
**Custom Auction ID:** {custom_auction_id}

**Details:**
- **Grade:** {data['grade']}
- **Quantity:** {data['quantity']} kg
- **Origin:** {data['origin']}
- **Starting Price:** LKR {float(data['base_price']):,.0f}
- **Start Time:** {data['start_time']}
- **Duration:** {duration_display}
{description_line}

Your auction has been created and will be visible to buyers!
            """.strip()
        else:
            error_msg = result.get("message", "Unknown error")

            answer = f"""
**Failed to Create Auction**

{error_msg}

Please try again or contact support if the problem persists.
            """.strip()

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": result.get("status") == "success",
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "message_type": "result",
            "result_payload": {
                "type": "result",
                "flow_id": str(conversation.conversation_id),
                "operation": "create_auction",
                "status": "success" if result.get("status") == "success" else "failed",
                "auction_id": result.get("auction_id"),
                "custom_auction_id": result.get("custom_auction_id"),
                "details": {
                    "grade": data.get("grade"),
                    "quantity": data.get("quantity"),
                    "origin": data.get("origin"),
                    "base_price": data.get("base_price"),
                    "start_time": data.get("start_time"),
                    "duration": data.get("duration"),
                },
                "error": None if result.get("status") == "success" else result.get("message"),
            },
            "auction_data": data,
            "api_result": result
        }

    async def _execute_delete_auction(
        self,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Execute auction deletion via MCP"""

        auction_id = state.partial_data.get("auction_id")
        auction_ref_id = state.partial_data.get("auction_ref_id") or auction_id

        logger.info(f"[AuctionHandler] Deleting auction {auction_id} via MCP")

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to delete auctions."
            )

        result = await self.mcp_client.delete_auction(
            auction_id=auction_id,
            user_id=str(user_id)
        )

        state_manager.delete_state(conversation.conversation_id)

        if result.get("status") == "success":
            answer = f"Auction **{auction_ref_id}** has been deleted successfully."
        else:
            error_msg = result.get("message", "Unknown error")
            answer = f"Failed to delete auction **{auction_ref_id}**: {error_msg}"

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": result.get("status") == "success",
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "message_type": "result",
            "result_payload": {
                "type": "result",
                "flow_id": str(conversation.conversation_id),
                "operation": "delete_auction",
                "status": "success" if result.get("status") == "success" else "failed",
                "auction_id": auction_id,
                "error": None if result.get("status") == "success" else result.get("message"),
            },
            "api_result": result
        }
    
    async def _handle_update_start(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle update auction flow with seller/schedule checks."""

        auction_identifier = parameter_extractor.extract_auction_id(user_message)

        if not auction_identifier:
            answer = (
                "Please specify which auction you want to update. "
                "You can use Auction ID or Ref ID, for example: "
                "'Update auction Ref ID TeaBlendSellerOP1Ratnapura21314 and change price to 18000'."
            )

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "message_type": "text",
            }

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to update auctions."
            )

        lookup = await self.mcp_client.get_auction_details(
            auction_id=auction_identifier,
            user_id=str(user_id),
        )

        if lookup.get("status") != "success":
            return self._rejection_response(
                conversation,
                f"I couldn't find an auction matching '{auction_identifier}' for your seller account."
            )

        auction_data = lookup.get("data") or {}
        resolved_auction_id = str(lookup.get("resolved_auction_id") or auction_data.get("auction_id") or auction_identifier)
        ref_id = auction_data.get("custom_auction_id") or resolved_auction_id
        status_value = str(auction_data.get("status") or "").strip().lower()

        if status_value != "scheduled":
            return self._rejection_response(
                conversation,
                (
                    f"Auction **{ref_id}** is currently **{auction_data.get('status', 'Unknown')}**. "
                    "Only scheduled auctions can be updated."
                )
            )

        extracted_updates = await parameter_extractor.extract_parameters(
            user_message,
            UPDATE_AUCTION_FIELDS["optional"],
            context={"auction_id": resolved_auction_id},
        )
        extracted_updates.pop("_validation_errors", None)
        extracted_updates.pop("_weekday_confirmation_required", None)
        extracted_updates.pop("_weekday_confirmation_expression", None)
        extracted_updates.pop("_weekday_confirmation_time_12h", None)

        # Only allow updateable fields and ignore helper/meta keys.
        allowed_update_fields = set(UPDATE_AUCTION_FIELDS["optional"])
        updates = {
            key: value
            for key, value in extracted_updates.items()
            if key in allowed_update_fields
        }

        state = state_manager.create_state(
            conversation_id=conversation.conversation_id,
            state_type="auction_management",
            action="update",
            required_fields=[],
            optional_fields=UPDATE_AUCTION_FIELDS["optional"],
            initial_data={
                "auction_id": resolved_auction_id,
                "auction_ref_id": ref_id,
                "current_status": auction_data.get("status"),
                **updates,
            }
        )

        if updates:
            return await self._generate_update_confirmation(conversation, state)

        answer = (
            f"I found auction **{ref_id}** (status: {auction_data.get('status')}). "
            "Tell me what you want to change, for example:\n"
            "- Change price to 18000\n"
            "- Change quantity to 25 kg\n"
            "- Change start time to 2026-04-01 15:00"
        )

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)
        
        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "state": "collecting_update_parameters",
            "message_type": "text",
        }
    
    async def _handle_delete_start(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle delete auction with status validation"""

        auction_identifier = parameter_extractor.extract_auction_id(user_message)

        if not auction_identifier:
            answer = (
                "Please specify which auction you want to delete. "
                "You can use Auction ID or Ref ID, for example: 'Delete auction Ref ID TeaBlendSellerOP1Ratnapura21314'."
            )

            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)

            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "message_type": "text",
            }

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to delete auctions."
            )

        lookup = await self.mcp_client.get_auction_details(
            auction_id=auction_identifier,
            user_id=str(user_id),
        )

        if lookup.get("status") != "success":
            return self._rejection_response(
                conversation,
                f"I couldn't find an auction matching '{auction_identifier}' for your seller account."
            )

        auction_data = lookup.get("data") or {}
        resolved_auction_id = str(lookup.get("resolved_auction_id") or auction_data.get("auction_id") or auction_identifier)
        ref_id = auction_data.get("custom_auction_id") or resolved_auction_id
        status_value = str(auction_data.get("status") or "").strip().lower()

        if status_value != "scheduled":
            return self._rejection_response(
                conversation,
                (
                    f"Auction **{ref_id}** is currently **{auction_data.get('status', 'Unknown')}**. "
                    "Only scheduled auctions can be deleted."
                )
            )

        answer = f"""
**Confirm Deletion**

Are you sure you want to delete auction **{ref_id}**?

This action cannot be undone.

Reply **'yes'** to confirm deletion, or **'no'** to cancel.

*Note: Live auctions cannot be deleted and will be protected.*
        """.strip()

        state_manager.create_state(
            conversation_id=conversation.conversation_id,
            state_type="auction_management",
            action="delete",
            required_fields=DELETE_AUCTION_FIELDS["required"],    # Use it
            optional_fields=DELETE_AUCTION_FIELDS["optional"],    # Use it
            initial_data={
                "auction_id": resolved_auction_id,
                "auction_ref_id": ref_id,
            }
        )

        state_manager.set_confirmation_pending(conversation.conversation_id, True)
        
        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)
        
        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "state": "awaiting_deletion_confirmation",
            "message_type": "auction_confirmation",
            "auction_payload": {
                "type": "auction_confirmation",
                "flow_id": str(conversation.conversation_id),
                "subtype": "delete_confirmation",
                "fields": {
                    "auction_id": resolved_auction_id,
                    "custom_auction_id": ref_id,
                },
                "actions": ["confirm", "cancel"],
            }
        }

    async def _generate_update_confirmation(
        self,
        conversation: Conversation,
        state: Any,
    ) -> Dict[str, Any]:
        """Generate confirmation for update auction flow."""

        data = state.partial_data
        ref_id = data.get("auction_ref_id") or data.get("auction_id")

        update_lines = []
        if data.get("grade") is not None:
            update_lines.append(f"- **Tea Grade:** {data.get('grade')}")
        if data.get("quantity") is not None:
            update_lines.append(f"- **Quantity:** {data.get('quantity')} kg")
        if data.get("origin") is not None:
            update_lines.append(f"- **Origin:** {data.get('origin')}")
        if data.get("base_price") is not None:
            update_lines.append(f"- **Starting Price:** LKR {float(data.get('base_price')):,.0f}")
        if data.get("start_time") is not None:
            update_lines.append(f"- **Start Time:** {format_datetime_for_display(str(data.get('start_time')))}")
        if data.get("duration") is not None:
            update_lines.append(
                f"- **Duration:** {self._format_duration_hours(data.get('duration'), input_unit=data.get('_duration_input_unit'))}"
            )
        if data.get("description") is not None:
            update_lines.append(f"- **Description:** {data.get('description')}")

        if not update_lines:
            answer = (
                f"I found auction **{ref_id}**. "
                "Tell me what to change (price, quantity, origin, start time, duration, description, or grade)."
            )
            assistant_msg = ChatMessage.create_assistant_message(
                conversation_id=conversation.conversation_id,
                content=answer,
                source="auction_management"
            )
            self.message_repo.create(assistant_msg)
            return {
                "success": True,
                "conversation_id": conversation.conversation_id,
                "answer": answer,
                "source": "auction_management",
                "state": "collecting_update_parameters",
                "message_type": "text",
            }

        answer = (
            f"**Please confirm update for auction {ref_id}:**\n\n"
            + "\n".join(update_lines)
            + "\n\nReply **'yes'** to apply these changes, **'no'** to cancel, or say **'change ...'** to edit again."
        )

        state_manager.set_confirmation_pending(conversation.conversation_id, True)

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "state": "awaiting_confirmation",
            "message_type": "auction_confirmation",
            "auction_payload": {
                "type": "auction_confirmation",
                "flow_id": str(conversation.conversation_id),
                "subtype": "update_confirmation",
                "fields": {
                    "auction_id": data.get("auction_id"),
                    "custom_auction_id": ref_id,
                    "grade": data.get("grade"),
                    "quantity": data.get("quantity"),
                    "origin": data.get("origin"),
                    "base_price": data.get("base_price"),
                    "start_time": data.get("start_time"),
                    "duration": data.get("duration"),
                    "description": data.get("description"),
                },
                "actions": ["confirm", "cancel", "change"],
            },
        }

    async def _execute_update_auction(
        self,
        conversation: Conversation,
        state: Any,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Execute auction update via MCP."""

        data = state.partial_data
        auction_id = data.get("auction_id")
        ref_id = data.get("auction_ref_id") or auction_id

        if not user_id:
            return self._rejection_response(
                conversation,
                "Authentication required. Please log in to update auctions."
            )

        result = await self.mcp_client.update_auction(
            auction_id=str(auction_id),
            user_id=str(user_id),
            grade=data.get("grade"),
            quantity=int(data.get("quantity")) if data.get("quantity") is not None else None,
            origin=data.get("origin"),
            base_price=float(data.get("base_price")) if data.get("base_price") is not None else None,
            start_time=data.get("start_time"),
            duration=int(data.get("duration")) if data.get("duration") is not None else None,
            description=data.get("description"),
        )

        state_manager.delete_state(conversation.conversation_id)

        if result.get("status") == "success":
            answer = f"Auction **{ref_id}** has been updated successfully."
        else:
            error_msg = result.get("message", "Unknown error")
            answer = f"Failed to update auction **{ref_id}**: {error_msg}"

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": result.get("status") == "success",
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "message_type": "result",
            "result_payload": {
                "type": "result",
                "flow_id": str(conversation.conversation_id),
                "operation": "update_auction",
                "status": "success" if result.get("status") == "success" else "failed",
                "auction_id": auction_id,
                "custom_auction_id": ref_id,
                "error": None if result.get("status") == "success" else result.get("message"),
            },
            "api_result": result
        }

    def _rejection_response(
        self,
        conversation: Conversation,
        message: str
    ) -> Dict[str, Any]:
        """Generate rejection response"""

        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=message,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)

        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": message,
            "source": "auction_management",
            "message_type": "text",
        }
    
    def _help_response(self, conversation: Conversation) -> Dict[str, Any]:
        """Provide help for auction management"""
        answer = """
        I can help you manage auctions! Here's what you can do:

        **Create an auction:**
        "Create an auction for 1000kg BOPF tea from Kandy at 17000 LKR"

        **Update a scheduled auction:**
        "Update auction Ref ID TeaBlendSellerOP1Ratnapura21314 and change price to 18000"

        **Delete a scheduled auction:**
        "Delete auction Ref ID TeaBlendSellerOP1Ratnapura21314"

        What would you like to do?
        """.strip()
        
        assistant_msg = ChatMessage.create_assistant_message(
            conversation_id=conversation.conversation_id,
            content=answer,
            source="auction_management"
        )
        self.message_repo.create(assistant_msg)
        
        return {
            "success": True,
            "conversation_id": conversation.conversation_id,
            "answer": answer,
            "source": "auction_management",
            "message_type": "text",
        }

    def _format_duration_hours(self, duration_value: Any, input_unit: Optional[str] = None) -> str:
        """Format duration for output with hour-first display, supporting legacy hour and minute inputs."""
        try:
            numeric = float(duration_value)

            # Input may come in legacy "hours" form (e.g., 12) or normalized minutes (e.g., 720).
            if input_unit == "hours":
                total_minutes = int(round(numeric * 60)) if numeric <= 24 else int(round(numeric))
            elif input_unit == "minutes":
                total_minutes = int(round(numeric))
            else:
                # Heuristic fallback for older states without explicit unit.
                total_minutes = int(round(numeric * 60)) if numeric <= 24 else int(round(numeric))

            hours = total_minutes // 60
            minutes = total_minutes % 60

            parts = []
            if hours:
                parts.append(f"{hours} hour" + ("s" if hours != 1 else ""))
            if minutes:
                parts.append(f"{minutes} minute" + ("s" if minutes != 1 else ""))

            if not parts:
                return "0 minutes"
            return " ".join(parts)
        except (TypeError, ValueError):
            return str(duration_value)
