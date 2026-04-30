from collections import defaultdict
from fastapi import WebSocket
from typing import Dict, Set
import asyncio
import logging

from src.domain.services.buyer.connection_manager import IConnectionManager


logger = logging.getLogger(__name__)


class AuctionConnectionManager(IConnectionManager):
    def __init__(self):
        self._rooms: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        try:
            await websocket.accept()
            async with self._lock:
                self._rooms[room_id].add(websocket)
        except Exception:
            logger.exception("Failed to connect websocket to room %s", room_id)
            raise

    async def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        try:
            async with self._lock:
                if room_id in self._rooms:
                    self._rooms[room_id].discard(websocket)
                    if not self._rooms[room_id]:
                        del self._rooms[room_id]
        except Exception:
            logger.exception("Failed to disconnect websocket from room %s", room_id)
            raise

    async def broadcast(self, room_id: str, message: dict) -> None:
        try:
            async with self._lock:
                sockets = list(self._rooms.get(room_id, set()))

            logger.info("Broadcasting to %s connections in room %s", len(sockets), room_id)

            dead = []
            for i, ws in enumerate(sockets):
                try:
                    logger.debug("Sending message %s/%s to %s", i + 1, len(sockets), ws.client)
                    await ws.send_json(message)
                except Exception:
                    logger.exception("Failed to send message %s to %s", i + 1, ws.client)
                    dead.append(ws)

            if dead:
                logger.info("Removing %s dead connections", len(dead))
                async with self._lock:
                    for ws in dead:
                        if room_id in self._rooms:
                            self._rooms[room_id].discard(ws)
        except Exception:
            logger.exception("Failed to broadcast to room %s", room_id)
            raise

    async def get_room_connections(self, room_id: str) -> Set[WebSocket]:
        try:
            async with self._lock:
                return set(self._rooms.get(room_id, set()))
        except Exception:
            logger.exception("Failed to get connections for room %s", room_id)
            raise

    async def get_all_rooms(self) -> Dict[str, Set[WebSocket]]:
        try:
            async with self._lock:
                return {room_id: set(sockets) for room_id, sockets in self._rooms.items()}
        except Exception:
            logger.exception("Failed to get all rooms")
            raise


auction_ws_manager = AuctionConnectionManager()