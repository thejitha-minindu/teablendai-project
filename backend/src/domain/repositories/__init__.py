"""
Repository Interfaces Package

This package contains all repository interface definitions (contracts).
Repository interfaces define WHAT operations can be performed on entities,
while repository implementations (in infrastructure layer) define HOW.

Architecture Pattern: Repository Pattern + Dependency Inversion Principle

Benefits:
1. Testability - Easy to create mock repositories for testing
2. Flexibility - Can swap implementations (SQL -> NoSQL) without changing business logic
3. Separation of Concerns - Business logic doesn't know about database details
4. Clear Contracts - Everyone knows what operations are available
"""


from .conversation_repository import ConversationRepositoryInterface
from .chat_repository import ChatMessageRepositoryInterface

# Export all repository interfaces
__all__ = [
    "ConversationRepositoryInterface",
    "ChatMessageRepositoryInterface",
]

# Version info
__version__ = "1.0.0"