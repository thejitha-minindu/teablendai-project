from fastapi import WebSocket, WebSocketDisconnect
from src.domain.services.buyer.connection_manager import IConnectionManager
import logging

class LiveAuctionSocketService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def handle_connection(self, websocket: WebSocket, auction_id: str) -> None:
        room_id = str(auction_id)
        await self.manager.connect(room_id, websocket)
        try:
            while True:
                # Keep socket alive; optional client ping payloads
                await websocket.receive_text()
        except WebSocketDisconnect:
            logging.info(f"WebSocket disconnected for auction {auction_id}")
            await self.manager.disconnect(room_id, websocket)
        except Exception as e:
            logging.error(f"Error in WebSocket for auction {auction_id}: {e}")
            await self.manager.disconnect(room_id, websocket)