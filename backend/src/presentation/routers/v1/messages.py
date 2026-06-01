from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from src.infrastructure.database.base import get_db
from src.domain.models.user import User
from src.domain.models.order import Order
from src.application.dependencies import get_current_user, get_ws_current_user
from src.application.schemas.order_message import OrderMessageCreate, OrderMessageResponse
from src.application.use_cases.order_message_service import OrderMessageService
from src.infrastructure.sockets.message_connection_manager import order_message_manager

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)

def get_message_service(db: Session = Depends(get_db)):
    return OrderMessageService(db)


@router.get("/order/{order_id}/info")
def get_order_chat_info(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns buyer + seller names for the chat header. Accessible by either party."""
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    seller_id = str(order.auction.seller_id) if order.auction else None
    user_id = str(current_user.user_id)

    if str(order.user_id) != user_id and seller_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    buyer = db.query(User).filter(User.user_id == order.user_id).first()
    seller = db.query(User).filter(User.user_id == seller_id).first() if seller_id else None

    buyer_name = " ".join(filter(None, [buyer.first_name, buyer.last_name])) if buyer else "Buyer"
    seller_name = (seller.seller_name or " ".join(filter(None, [seller.first_name, seller.last_name]))) if seller else "Seller"

    return {
        "order_id": str(order.order_id),
        "user_id": str(order.user_id),
        "buyer_name": buyer_name,
        "seller_name": seller_name,
        "estate_name": order.auction.estate_name if order.auction else None,
    }


@router.get("/order/{order_id}", response_model=List[OrderMessageResponse])
def get_order_messages(
    order_id: str,
    service: OrderMessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    """Get message history for an order."""
    return service.get_messages(order_id, current_user)


@router.post("/order/{order_id}", response_model=OrderMessageResponse)
async def create_order_message(
    order_id: str,
    message: OrderMessageCreate,
    service: OrderMessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    """Send a new message to an order chat."""
    new_msg = service.create_message(order_id, str(current_user.user_id), message.content)
    
    # Broadcast to connected clients
    # Need to convert to dict manually to match response schema roughly
    msg_dict = {
        "message_id": str(new_msg.message_id),
        "order_id": str(new_msg.order_id),
        "sender_id": str(new_msg.sender_id),
        "content": new_msg.content,
        "timestamp": new_msg.timestamp.isoformat() if new_msg.timestamp else None
    }
    await order_message_manager.broadcast_to_order(order_id, msg_dict)
    
    return new_msg


@router.websocket("/order/{order_id}/ws")
async def order_message_websocket(
    websocket: WebSocket,
    order_id: str,
    token: str = Query(...),
    current_user: User = Depends(get_ws_current_user),
    service: OrderMessageService = Depends(get_message_service),
):
    """WebSocket for real-time order chat."""
    try:
        # Verify user has access to this order's chat
        service._verify_access(order_id, str(current_user.user_id))
    except Exception as e:
        logger.error(f"WebSocket auth failed for order {order_id}: {e}")
        await websocket.close(code=1008)
        return

    await order_message_manager.connect(websocket, order_id)
    
    try:
        while True:
            # Wait for any incoming messages from this client (if they send via WS directly)
            data = await websocket.receive_text()
            
            try:
                payload = json.loads(data)
                
                # If they send a ping, we can ignore or pong
                if payload.get("type") == "ping":
                    continue
                
                content = payload.get("content")
                if content:
                    # Save to DB
                    new_msg = service.create_message(order_id, str(current_user.user_id), content)
                    
                    # Broadcast
                    msg_dict = {
                        "message_id": str(new_msg.message_id),
                        "order_id": str(new_msg.order_id),
                        "sender_id": str(new_msg.sender_id),
                        "content": new_msg.content,
                        "timestamp": new_msg.timestamp.isoformat() if new_msg.timestamp else None
                    }
                    await order_message_manager.broadcast_to_order(order_id, msg_dict)
                    
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        order_message_manager.disconnect(websocket, order_id)
    except Exception as e:
        logger.error(f"Error in order_message_websocket: {e}")
        order_message_manager.disconnect(websocket, order_id)
