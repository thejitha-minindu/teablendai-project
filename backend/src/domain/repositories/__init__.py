"""
Repository Interfaces Package

This package contains all repository interface definitions (contracts).
Repository interfaces define WHAT operations can be performed on entities,
while repository implementations (in infrastructure layer) define HOW.

Architecture Pattern: Repository Pattern + Dependency Inversion Principle
"""


from .chatbot.conversation_repository import ConversationRepositoryInterface
from .chatbot.chat_repository import ChatMessageRepositoryInterface

# Export all repository interfaces
__all__ = [
    "ConversationRepositoryInterface",
    "ChatMessageRepositoryInterface",
]

# Version info
__version__ = "1.0.0"