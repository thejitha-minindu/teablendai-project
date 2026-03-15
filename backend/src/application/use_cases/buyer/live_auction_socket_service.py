from fastapi import WebSocket, WebSocketDisconnect
from src.domain.services.buyer.connection_manager import IConnectionManager
import logging

logger = logging.getLogger(__name__)

class LiveAuctionSocketService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def handle_connection(self, websocket: WebSocket, auction_id: str) -> None:
        room_id = str(auction_id)
        await self.manager.connect(room_id, websocket)
        logger.info(f"✅ WebSocket connection established for auction {auction_id}")
        
        try:
            while True:
                # Keep socket alive; optional client ping payloads
                try:
                    data = await websocket.receive_text()
                    logger.debug(f"Received from client on {auction_id}: {data}")
                except Exception as recv_err:
                    logger.error(f"Error receiving data on {auction_id}: {recv_err}")
                    break
        except WebSocketDisconnect:
            logger.info(f"🔌 WebSocket disconnected for auction {auction_id}")
            await self.manager.disconnect(room_id, websocket)
        except Exception as e:
            logger.error(f"Unexpected error in WebSocket for auction {auction_id}: {e}", exc_info=True)
            await self.manager.disconnect(room_id, websocket)