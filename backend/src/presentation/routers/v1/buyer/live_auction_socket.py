from fastapi import APIRouter, WebSocket, Query, status
from sqlalchemy.orm import Session
from src.application.use_cases.buyer.live_auction_socket_service import LiveAuctionSocketService
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
from src.application.security import SECRET_KEY, ALGORITHM
from src.infrastructure.database.base import SessionLocal
from src.domain.models.user import User
from jose import jwt, JWTError
import logging

router = APIRouter(prefix="/live", tags=["auction-ws"])
logger = logging.getLogger(__name__)

def get_live_auction_socket_service() -> LiveAuctionSocketService:
    return LiveAuctionSocketService(auction_ws_manager)

@router.websocket("/auction/{auction_id}")
async def create_bid(
    websocket: WebSocket,
    auction_id: str,
    token: str = Query(...),
):
    """WebSocket endpoint for live auction bidding - requires JWT token"""
    db: Session = None
    service = None
    
    try:
        # Verify token
        logger.debug(f"Verifying WebSocket token for auction {auction_id}")
        
        if not token:
            await websocket.accept()
            await websocket.send_json({"error": "Missing authentication token"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
            logger.warning(f"WebSocket rejected for {auction_id}: No token")
            return
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError as e:
            logger.warning(f"Invalid JWT token for {auction_id}: {e}")
            await websocket.accept()
            await websocket.send_json({"error": "Invalid token"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        
        email: str = payload.get("sub")
        if not email:
            logger.warning(f"WebSocket token missing email claim for {auction_id}")
            await websocket.accept()
            await websocket.send_json({"error": "Invalid token: no email"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        
        # Get database session
        db = SessionLocal()
        
        # Verify user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"WebSocket user not found: {email} for auction {auction_id}")
            await websocket.accept()
            await websocket.send_json({"error": "User not found"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            return
        
        logger.info(f"WebSocket verified for user {email} on auction {auction_id}")
        
        service = get_live_auction_socket_service()
        await service.handle_connection(websocket, auction_id)
        
    except Exception as e:
        logger.error(f"WebSocket error for auction {auction_id}: {e}", exc_info=True)
        try:
            if websocket.client_state.value < 2:  # Not already closing/closed
                await websocket.accept()
            await websocket.send_json({"error": "Internal server error"})
            await websocket.close(code=status.WS_1011_SERVER_ERROR, reason="Internal error")
        except Exception as close_err:
            logger.error(f"Error closing WebSocket: {close_err}")
    finally:
        if db:
            db.close()
        logger.debug(f"WebSocket cleanup complete for auction {auction_id}")