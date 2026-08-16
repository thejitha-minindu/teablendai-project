from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class SystemLogRepositoryInterface(ABC):
    @abstractmethod
    def create(self, log_data: dict):
        """Create a new system log entry."""
        logger.debug(f"Attempting to create system log: {log_data}")
        pass

    @abstractmethod
    def get_all(self, filters: dict = None, skip: int = 0, limit: int = 50):
        """List system logs with optional filters."""
        logger.debug("Listing system logs")
        pass

    @abstractmethod
    def get_recent(self, limit: int = 20):
        """Get most recent system logs."""
        logger.debug(f"Fetching recent {limit} system logs")
        pass

    @abstractmethod
    def count(self, filters: dict = None) -> int:
        """Count system logs matching filters."""
        logger.debug("Counting system logs")
        pass
