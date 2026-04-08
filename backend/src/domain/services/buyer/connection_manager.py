from abc import ABC, abstractmethod
from typing import Dict, Set, Any

class IConnectionManager(ABC):
    # Interface for managing WebSocket connections
    # Uses Any for websocket parameter to avoid fastapi framework dependency in domain layer

    @abstractmethod
    async def connect(self, room_id: str, websocket: Any) -> None:
        # Accept and register a WebSocket connection to a room
        pass

    @abstractmethod
    async def disconnect(self, room_id: str, websocket: Any) -> None:
        # Remove a WebSocket connection from a room
        pass

    @abstractmethod
    async def broadcast(self, room_id: str, message: Dict[str, Any]) -> None:
        # Send a message to all connections in a room
        pass

    @abstractmethod
    async def get_room_connections(self, room_id: str) -> Set[Any]:
        # Get all active connections in a room
        pass

    @abstractmethod
    async def get_all_rooms(self) -> Dict[str, Set[Any]]:
        # Get all rooms and their connections
        pass