from datetime import datetime
from sqlalchemy import text
import json
import logging
import re
from uuid import UUID

logger = logging.getLogger(__name__)


class ChatHistoryDB:
    """Manage chat history in MSSQL TeaBlendAI database"""

    def __init__(self, engine):
        self.engine = engine

    def create_conversation(self, title=None):
        """Create a new conversation"""
        if not title:
            title = f"Conversation - {datetime.now().strftime('%Y-%m-%d %H:%M')}"

        with self.engine.connect() as conn:
            result = conn.execute(  
                text("""
                    INSERT INTO Conversations (Title)
                    OUTPUT INSERTED.ConversationID
                    VALUES (:title)
                """),
                {"title": title}
            )
            conversation_id = result.fetchone()[0]
            conn.commit()
        return conversation_id

    def save_message(self, conversation_id: UUID | str, role, content, sql_query=None,
                     data=None, visualization_type=None):
        """Save a message to conversation"""
        with self.engine.connect() as conn:
            data_json = json.dumps(data) if data else None

            conn.execute(
                text("""
                    INSERT INTO Messages 
                    (ConversationID, Role, Content, SQLQuery, DataJSON, VisualizationType)
                    VALUES (:conv_id, :role, :content, :sql_query, :data_json, :viz_type)
                """),
                {
                    "conv_id": str(conversation_id),
                    "role": role,
                    "content": content,
                    "sql_query": sql_query,
                    "data_json": data_json,
                    "viz_type": visualization_type,
                }
            )
            conn.commit()

    def get_conversations(self, limit=50, offset=0):
        """Get conversations with message counts"""
        with self.engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        c.ConversationID   AS id,
                        c.Title            AS title,
                        c.CreatedAt        AS created_at,
                        c.UpdatedAt        AS updated_at,
                        COUNT(m.MessageID) AS message_count,
                        (
                            SELECT TOP 1 Content
                            FROM Messages
                            WHERE ConversationID = c.ConversationID
                            ORDER BY Timestamp ASC
                        ) AS preview
                    FROM Conversations c
                    LEFT JOIN Messages m ON c.ConversationID = m.ConversationID
                    GROUP BY c.ConversationID, c.Title, c.CreatedAt, c.UpdatedAt
                    ORDER BY COALESCE(c.UpdatedAt, c.CreatedAt) DESC
                    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
                """),
                {"limit": limit, "offset": offset}
            )

            conversations = []
            for row in result.mappings(): 
                conversations.append({
                    "id":            row["id"],
                    "title":         row["title"],
                    "created_at":    self._safe_dt(row["created_at"]),
                    "updated_at":    self._safe_dt(row["updated_at"]),
                    "message_count": row["message_count"] or 0,
                    "preview":       (row["preview"] or "")[:100],
                })
            return conversations

    def get_conversation_messages(self, conversation_id: UUID | str):
        """Retrieve messages for a specific conversation with visualization data"""
        with self.engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        MessageID              AS id,
                        ConversationID         AS conversation_id,
                        Role                   AS role,
                        Content                AS content,
                        SQLQuery               AS sql_query,
                        DataJSON               AS data_json,
                        VisualizationType      AS visualization_type,
                        VisualizationData      AS visualization_data,
                        SearchResults          AS search_results,
                        Source                 AS source,
                        ResponseTimeMs         AS response_time_ms,
                        Timestamp              AS timestamp
                    FROM Messages
                    WHERE ConversationID = :conv_id
                    ORDER BY Timestamp ASC
                """),
                {"conv_id": str(conversation_id)}
            )

            messages = []
            for row in result.mappings():  
                message = {
                    "id":                   row["id"],
                    "conversation_id":      row["conversation_id"],
                    "role":                 row["role"],
                    "content":              row["content"],
                    "sql_query":            row["sql_query"],
                    "visualization_type":   row["visualization_type"],
                    "source":               row["source"],
                    "timestamp":            self._safe_dt(row["timestamp"]),
                    "response_time_ms":     row["response_time_ms"]
                }

                # Parse raw data payload for structured frontend rendering (e.g., auction cards)
                parsed_data = None
                if row["data_json"]:
                    try:
                        parsed_data = json.loads(row["data_json"])
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Failed to parse data_json: {e}")
                        parsed_data = None

                message["data"] = parsed_data
                if isinstance(parsed_data, list):
                    message["row_count"] = len(parsed_data)
                else:
                    message["row_count"] = 0

                # Infer data type for older records that don't persist data_type explicitly
                if self._looks_like_auction_data(parsed_data):
                    message["data_type"] = "auction"
                
                # Parse visualization data from JSON string
                if row["visualization_data"]:
                    try:
                        message["visualization"] = json.loads(row["visualization_data"])
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Failed to parse visualization data: {e}")
                        message["visualization"] = None
                else:
                    message["visualization"] = None
                
                # Parse search results if present
                if row["search_results"]:
                    try:
                        message["search_results"] = json.loads(row["search_results"])
                    except (ValueError, TypeError):
                        message["search_results"] = None
                else:
                    message["search_results"] = None

                if message.get("source") == "auction_management" and message.get("role") == "assistant":
                    structured = self._rehydrate_auction_message(message, conversation_id)
                    message.update(structured)

                messages.append(message)
            
            return messages

    @staticmethod
    def _looks_like_auction_data(data) -> bool:
        """Best-effort detection of auction rows in message data payloads."""
        if not isinstance(data, list) or not data:
            return False

        first = data[0]
        if not isinstance(first, dict):
            return False

        auction_keys = {"auction_id", "grade", "quantity", "base_price", "origin", "status", "start_time"}
        return len(auction_keys.intersection(set(first.keys()))) >= 3

    def _rehydrate_auction_message(self, message: dict, conversation_id: UUID | str) -> dict:
        """Infer structured auction fields from persisted assistant message content."""
        content = str(message.get("content") or "")
        normalized = content.lower()

        validation_payload = self._parse_validation_payload(content)
        input_request = self._detect_input_request(content, conversation_id)
        auction_payload = self._parse_auction_payload(content, conversation_id)
        result_payload = self._parse_result_payload(content, conversation_id)

        structured: dict = {}

        if validation_payload:
            structured["message_type"] = "validation_error"
            structured["validation_payload"] = validation_payload
            if input_request:
                structured["prompt_type"] = "field_input"
                structured["field_metadata"] = {
                    "field_name": input_request.get("field_name"),
                    "field_type": input_request.get("field_type"),
                    "options": input_request.get("options", []),
                    "validation": input_request.get("validation", {}),
                }
                structured["input_request"] = input_request
            return structured

        if input_request:
            structured["message_type"] = "input_request"
            structured["prompt_type"] = "field_input"
            structured["field_metadata"] = {
                "field_name": input_request.get("field_name"),
                "field_type": input_request.get("field_type"),
                "options": input_request.get("options", []),
                "validation": input_request.get("validation", {}),
            }
            structured["input_request"] = input_request
            return structured

        if auction_payload:
            structured["message_type"] = "auction_confirmation"
            structured["auction_payload"] = auction_payload
            return structured

        if result_payload:
            structured["message_type"] = "result"
            structured["result_payload"] = result_payload
            return structured

        if normalized:
            structured["message_type"] = "text"

        return structured

    def _detect_input_request(self, content: str, conversation_id: UUID | str) -> dict | None:
        normalized = content.lower().strip()

        field_map = [
            ("grade", "what tea grade?"),
            ("quantity", "how many kilograms?"),
            ("origin", "what's the origin region?"),
            ("base_price", "what's the starting bid price"),
            ("start_time", "when should the auction start?"),
            ("duration", "how long should it run?"),
            ("description", "any additional description?"),
            ("auction_id", "what's the auction id?"),
        ]

        field_name = None
        for candidate, marker in field_map:
            if marker in normalized:
                field_name = candidate
                break

        if not field_name:
            return None

        field_type = self._auction_field_type(field_name)
        return {
            "type": "input_request",
            "flow_id": str(conversation_id),
            "field_name": field_name,
            "field_type": field_type,
            "options": self._auction_field_options(field_name),
            "validation": self._auction_field_validation(field_name),
        }

    def _parse_validation_payload(self, content: str) -> dict | None:
        errors = []
        for line in content.splitlines():
            match = re.search(r"❌\s*\*\*(.*?)\*\*:\s*(.+)", line.strip())
            if not match:
                continue
            field_raw = match.group(1).strip().lower().replace(" ", "_")
            errors.append({
                "field": field_raw,
                "error": match.group(2).strip(),
            })

        if not errors:
            return None

        return {
            "type": "validation_error",
            "field_errors": errors,
        }

    def _parse_auction_payload(self, content: str, conversation_id: UUID | str) -> dict | None:
        normalized = content.lower()

        if "please confirm auction details" in normalized:
            tea_grade = self._extract_markdown_value(content, "Tea Grade")
            quantity_text = self._extract_markdown_value(content, "Quantity")
            origin = self._extract_markdown_value(content, "Origin")
            price_text = self._extract_markdown_value(content, "Starting Price")
            start_time = self._extract_markdown_value(content, "Start Time")
            duration = self._extract_markdown_value(content, "Duration")
            description = self._extract_markdown_value(content, "Description")

            quantity_value = None
            if quantity_text:
                quantity_match = re.search(r"([\d,.]+)", quantity_text)
                if quantity_match:
                    quantity_value = quantity_match.group(1).replace(",", "")

            price_value = None
            if price_text:
                price_match = re.search(r"([\d,.]+)", price_text)
                if price_match:
                    price_value = price_match.group(1).replace(",", "")

            return {
                "type": "auction_confirmation",
                "flow_id": str(conversation_id),
                "fields": {
                    "grade": tea_grade,
                    "quantity": quantity_value,
                    "origin": origin,
                    "base_price": price_value,
                    "start_time": start_time,
                    "duration": duration,
                    "description": description,
                },
                "display": {
                    "start_time": start_time,
                    "duration": duration,
                },
                "actions": ["confirm", "cancel", "change"],
            }

        if "confirm deletion" in normalized:
            auction_id_match = re.search(r"auction\s*#\s*([A-Za-z0-9-]+)", content, re.IGNORECASE)
            return {
                "type": "auction_confirmation",
                "flow_id": str(conversation_id),
                "subtype": "delete_confirmation",
                "fields": {
                    "auction_id": auction_id_match.group(1) if auction_id_match else None,
                },
                "actions": ["confirm", "cancel"],
            }

        if "would you like me to generate one for you" in normalized:
            return {
                "type": "auction_confirmation",
                "flow_id": str(conversation_id),
                "subtype": "description_generation_choice",
                "fields": {
                    "description": None,
                },
                "actions": ["confirm", "cancel", "change"],
            }

        if "i've prepared a description for you" in normalized and "would you like to use this" in normalized:
            generated_match = re.search(r"_([^_]+)_", content)
            return {
                "type": "auction_confirmation",
                "flow_id": str(conversation_id),
                "subtype": "description_generated_confirmation",
                "fields": {
                    "description": generated_match.group(1).strip() if generated_match else None,
                },
                "actions": ["confirm", "cancel", "change"],
            }

        if "please confirm if this is correct" in normalized and "reply **'yes'**" in normalized:
            start_time_match = re.search(r"That corresponds to\s*\*\*(.+?)\*\*", content, re.IGNORECASE)
            return {
                "type": "auction_confirmation",
                "flow_id": str(conversation_id),
                "subtype": "start_time_confirmation",
                "fields": {
                    "start_time": start_time_match.group(1).strip() if start_time_match else None,
                },
                "actions": ["confirm", "cancel", "change"],
            }

        return None

    def _parse_result_payload(self, content: str, conversation_id: UUID | str) -> dict | None:
        normalized = content.lower()

        if "auction created successfully" in normalized or "failed to create auction" in normalized:
            auction_id_match = re.search(r"\*\*Auction ID:\*\*\s*([A-Za-z0-9-]+)", content, re.IGNORECASE)
            is_success = "auction created successfully" in normalized
            return {
                "type": "result",
                "flow_id": str(conversation_id),
                "operation": "create_auction",
                "status": "success" if is_success else "failed",
                "auction_id": auction_id_match.group(1) if auction_id_match else None,
                "error": None if is_success else content,
            }

        if "has been deleted successfully" in normalized or "failed to delete auction" in normalized:
            auction_id_match = re.search(r"auction\s*#\s*([A-Za-z0-9-]+)", content, re.IGNORECASE)
            is_success = "has been deleted successfully" in normalized
            return {
                "type": "result",
                "flow_id": str(conversation_id),
                "operation": "delete_auction",
                "status": "success" if is_success else "failed",
                "auction_id": auction_id_match.group(1) if auction_id_match else None,
                "error": None if is_success else content,
            }

        return None

    @staticmethod
    def _extract_markdown_value(content: str, label: str) -> str | None:
        pattern = rf"\*\*{re.escape(label)}:\*\*\s*(.+)"
        match = re.search(pattern, content, re.IGNORECASE)
        if not match:
            return None
        return match.group(1).strip()

    @staticmethod
    def _auction_field_type(field_name: str) -> str:
        field_types = {
            "grade": "select",
            "quantity": "number",
            "origin": "select",
            "base_price": "number",
            "start_time": "datetime",
            "duration": "number",
            "description": "textarea",
            "auction_id": "text",
        }
        return field_types.get(field_name, "text")

    @staticmethod
    def _auction_field_options(field_name: str) -> list:
        if field_name == "grade":
            return ["BOP", "BOPF", "OP", "OP1", "Pekoe", "Fannings", "Dust", "FBOP"]
        if field_name == "origin":
            return [
                "Nuwara Eliya",
                "Kandy",
                "Dimbula",
                "Uva",
                "Ruhuna",
                "Sabaragamuwa",
                "Uda Pussellawa",
                "Ratnapura",
            ]
        return []

    @staticmethod
    def _auction_field_validation(field_name: str) -> dict:
        validation = {
            "grade": {"required": True, "type": "string"},
            "quantity": {"required": True, "type": "number", "min": 1, "max": 100000},
            "origin": {"required": True, "type": "string"},
            "base_price": {"required": True, "type": "number", "min": 1, "max": 10000000},
            "start_time": {"required": True, "type": "datetime", "min": "now", "min_minutes_ahead": 5},
            "duration": {"required": True, "type": "number", "min": 1, "max": 72, "unit": "hours"},
            "description": {"required": False, "type": "string", "maxLength": 500},
            "auction_id": {"required": True, "type": "text"},
        }
        return validation.get(field_name, {})

    def delete_conversation(self, conversation_id: UUID | str):
        """Delete a conversation (messages deleted by CASCADE)"""
        with self.engine.connect() as conn:
            conn.execute(
                text("DELETE FROM Conversations WHERE ConversationID = :conv_id"),
                {"conv_id": str(conversation_id)}
            )
            conn.commit()

    def delete_empty_conversations(self):
        """Delete conversations with no messages"""
        with self.engine.connect() as conn:
            conn.execute(
                text("""
                    DELETE FROM Conversations
                    WHERE ConversationID NOT IN (
                        SELECT DISTINCT ConversationID FROM Messages
                    )
                """)
            )
            conn.commit()

    def update_conversation_title(self, conversation_id: UUID | str, title):
        """Update conversation title"""
        with self.engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE Conversations
                    SET Title = :title, UpdatedAt = GETDATE()
                    WHERE ConversationID = :conv_id
                """),
                {"title": title, "conv_id": str(conversation_id)}
            )
            conn.commit()

    @staticmethod
    def _safe_dt(value) -> str | None:
        """Safely convert any datetime-like value to ISO string"""
        if value is None:
            return None
        if hasattr(value, "isoformat"):
            return value.isoformat()
        if isinstance(value, (int, float)):
            # Unix timestamp - handle seconds or milliseconds
            ts = value / 1000 if value > 1e10 else value
            return datetime.fromtimestamp(ts).isoformat()
        return str(value)