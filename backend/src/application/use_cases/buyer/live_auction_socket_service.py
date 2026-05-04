from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from src.domain.services.buyer.connection_manager import IConnectionManager
from src.infrastructure.repositories.buyer.auction_repository import AuctionRepository
import logging

logger = logging.getLogger(__name__)


class LiveAuctionSocketService:
    def __init__(self, manager: IConnectionManager, db: Session):
        self.manager = manager
        self.repo = AuctionRepository(db)

    async def handle_connection(
        self,
        websocket: WebSocket,
        auction_id: str,
        user_id: str,
    ) -> None:
        auction = self.repo.get_auction_by_id(auction_id)
        if not auction:
            logger.warning(f"WS: auction {auction_id} not found, rejecting connection")
            await websocket.accept()
            await websocket.send_json({"error": f"Auction {auction_id} not found"})
            await websocket.close(code=1008, reason="Auction not found")
            return

        logger.info(f"WS: user {user_id} connecting to auction {auction_id} (status={auction.status})")

        room_id = str(auction_id)
        await self.manager.connect(room_id, websocket)
        logger.info(f"WS connected: user={user_id} auction={auction_id}")

        try:
            while True:
                # Keep socket alive; clients may send pings
                data = await websocket.receive_text()
                logger.debug(f"WS received from user={user_id} auction={auction_id}: {data}")

        except WebSocketDisconnect:
            logger.info(f"WS disconnected: user={user_id} auction={auction_id}")
        except Exception as e:
            logger.error(f"WS error: user={user_id} auction={auction_id}: {e}", exc_info=True)
        finally:
            await self.manager.disconnect(room_id, websocket)
            logger.info(f"WS cleanup done: user={user_id} auction={auction_id}")