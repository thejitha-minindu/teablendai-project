from collections import defaultdict
from fastapi import WebSocket
from typing import Dict, Set
import asyncio

from src.domain.services.buyer.connection_manager import IConnectionManager


class AuctionConnectionManager(IConnectionManager):
    def __init__(self):
        self._rooms: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._rooms[room_id].add(websocket)

    async def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if room_id in self._rooms and websocket in self._rooms[room_id]:
                self._rooms[room_id].remove(websocket)
            if room_id in self._rooms and not self._rooms[room_id]:
                del self._rooms[room_id]

    async def broadcast(self, room_id: str, message: dict) -> None:
        async with self._lock:
            sockets = list(self._rooms.get(room_id, set()))

        dead = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    if room_id in self._rooms and ws in self._rooms[room_id]:
                        self._rooms[room_id].remove(ws)

    async def get_room_connections(self, room_id: str) -> Set[WebSocket]:
        async with self._lock:
            return set(self._rooms.get(room_id, set()))

    async def get_all_rooms(self) -> Dict[str, Set[WebSocket]]:
        async with self._lock:
            return {room_id: set(sockets) for room_id, sockets in self._rooms.items()}


auction_ws_manager = AuctionConnectionManager()