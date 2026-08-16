from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class OrderMessageConnectionManager:
    def __init__(self):
        # order_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = []
        self.active_connections[order_id].append(websocket)
        logger.info(f"WebSocket connected to order {order_id}. Total connections: {len(self.active_connections[order_id])}")

    def disconnect(self, websocket: WebSocket, order_id: str):
        if order_id in self.active_connections:
            if websocket in self.active_connections[order_id]:
                self.active_connections[order_id].remove(websocket)
                logger.info(f"WebSocket disconnected from order {order_id}. Remaining: {len(self.active_connections[order_id])}")
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]

    async def broadcast_to_order(self, order_id: str, message: dict):
        if order_id in self.active_connections:
            # We must serialize datetime to isoformat
            # This relies on the message dict being JSON serializable
            json_str = json.dumps(message, default=str)
            disconnected = []
            for connection in self.active_connections[order_id]:
                try:
                    await connection.send_text(json_str)
                except Exception as e:
                    logger.error(f"Error broadcasting to order {order_id}: {e}")
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn, order_id)

order_message_manager = OrderMessageConnectionManager()
