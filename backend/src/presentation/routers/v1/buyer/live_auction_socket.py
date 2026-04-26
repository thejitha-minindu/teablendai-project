import logging
from fastapi import APIRouter, WebSocket, Query, Depends
from sqlalchemy.orm import Session

from src.application.dependencies import get_ws_current_buyer
from src.infrastructure.database.base import get_db
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
from src.application.services.buyer.live_auction_socket_service import LiveAuctionSocketService
from src.domain.models.user import User

router = APIRouter(prefix="/live", tags=["auction-ws"])
logger = logging.getLogger(__name__)


def get_live_auction_socket_service(db: Session = Depends(get_db)) -> LiveAuctionSocketService:
    return LiveAuctionSocketService(auction_ws_manager, db)


@router.websocket("/auction/{auction_id}")
async def live_auction_websocket(
    websocket: WebSocket,
    auction_id: str,
    token: str = Query(...),
    current_user: User = Depends(get_ws_current_buyer),
    service: LiveAuctionSocketService = Depends(get_live_auction_socket_service),
):
    """WebSocket endpoint for live auction bidding"""
    await service.handle_connection(websocket, auction_id, str(current_user.user_id))