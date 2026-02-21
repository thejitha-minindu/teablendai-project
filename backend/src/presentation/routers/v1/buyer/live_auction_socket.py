from fastapi import APIRouter, WebSocket, Depends

from src.application.use_cases.buyer.live_auction_socket_service import LiveAuctionSocketService
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager

router = APIRouter(prefix="/bids", tags=["bids-ws"])


def get_live_auction_socket_service() -> LiveAuctionSocketService:
   return LiveAuctionSocketService(auction_ws_manager)


@router.websocket("/live/auction/{auction_id}")
async def create_bid(
   websocket: WebSocket,
   auction_id: str,
   service: LiveAuctionSocketService = Depends(get_live_auction_socket_service),
):
   return await service.handle_connection(websocket, auction_id)