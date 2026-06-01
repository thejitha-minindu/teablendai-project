from abc import ABC, abstractmethod
from typing import Dict, Set, Any

class IConnectionManager(ABC):
    # Interface for managing WebSocket connections

    # Accept and register a WebSocket connection to a room
    @abstractmethod
    async def connect(self, room_id: str, websocket: Any) -> None:
        pass

    # Remove a WebSocket connection from a room
    @abstractmethod
    async def disconnect(self, room_id: str, websocket: Any) -> None:
        pass

    # Send a message to all connections in a room
    @abstractmethod
    async def broadcast(self, room_id: str, message: Dict[str, Any]) -> None:
        pass

    # Get all active connections in a room
    @abstractmethod
    async def get_room_connections(self, room_id: str) -> Set[Any]:
        pass

    # Get all rooms and their connections
    @abstractmethod
    async def get_all_rooms(self) -> Dict[str, Set[Any]]:
        pass