"""Async event queue for deferred event processing."""
import asyncio
from typing import Dict, Callable, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class QueuedEvent:
    """Event waiting in queue."""
    auction_id: str
    message: dict
    queued_at: float


class EventQueue:
    """Per-auction async queue for event processing."""
    
    def __init__(self):
        self.queues: Dict[str, asyncio.Queue] = {}
        self.lock = asyncio.Lock()
    
    async def enqueue(self, auction_id: str, message: dict) -> None:
        """Add event to auction queue."""
        async with self.lock:
            if auction_id not in self.queues:
                self.queues[auction_id] = asyncio.Queue()
        
        await self.queues[auction_id].put(message)
        logger.debug(f"Event queued for auction {auction_id}")
    
    async def dequeue(self, auction_id: str, timeout: float = 1.0) -> List[dict]:
        """Get all pending messages for auction (non-blocking batch)."""
        if auction_id not in self.queues:
            return []
        
        queue = self.queues[auction_id]
        messages = []
        
        try:
            while True:
                msg = queue.get_nowait()
                messages.append(msg)
        except asyncio.QueueEmpty:
            pass
        
        return messages
    
    async def wait_for_event(self, auction_id: str, timeout: float = 1.0) -> dict:
        """Wait for next event (blocking)."""
        async with self.lock:
            if auction_id not in self.queues:
                self.queues[auction_id] = asyncio.Queue()
        
        try:
            return await asyncio.wait_for(
                self.queues[auction_id].get(),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            return None
    
    def queue_size(self, auction_id: str) -> int:
        """Get pending message count."""
        if auction_id not in self.queues:
            return 0
        return self.queues[auction_id].qsize()


# Global instance
event_queue = EventQueue()
