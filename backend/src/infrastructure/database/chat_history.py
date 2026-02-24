from datetime import datetime
from sqlalchemy import text
import json
import logging

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
            result = conn.execute(   # ✅ Fixed typo: excute → execute
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

    def save_message(self, conversation_id, role, content, sql_query=None,
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
                    "conv_id": conversation_id,
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
            for row in result.mappings():   # ✅ Use .mappings() - access by column name
                conversations.append({
                    "id":            row["id"],
                    "title":         row["title"],
                    "created_at":    self._safe_dt(row["created_at"]),
                    "updated_at":    self._safe_dt(row["updated_at"]),
                    "message_count": row["message_count"] or 0,
                    "preview":       (row["preview"] or "")[:100],
                })
            return conversations

    def get_conversation_messages(self, conversation_id):
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
                {"conv_id": conversation_id}
            )

            messages = []
            for row in result.mappings():   # ✅ Use .mappings() for named access
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

                messages.append(message)
            
            return messages

    def delete_conversation(self, conversation_id):
        """Delete a conversation (messages deleted by CASCADE)"""
        with self.engine.connect() as conn:
            conn.execute(
                text("DELETE FROM Conversations WHERE ConversationID = :conv_id"),
                {"conv_id": conversation_id}
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

    def update_conversation_title(self, conversation_id, title):
        """Update conversation title"""
        with self.engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE Conversations
                    SET Title = :title, UpdatedAt = GETDATE()
                    WHERE ConversationID = :conv_id
                """),
                {"title": title, "conv_id": conversation_id}
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