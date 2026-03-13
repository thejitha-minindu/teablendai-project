"""
Query Intent Classifier
"""

import logging
from typing import Literal

logger = logging.getLogger(__name__)

QueryIntent = Literal["database", "knowledge", "hybrid", "auction_management"]


class IntentClassifier:
    """Classify user queries by intent"""

    # Auction action keywords
    AUCTION_ACTION_KEYWORDS = {
        # Create actions
        'create auction', 'new auction', 'list tea', 'add auction',
        'start auction', 'post auction', 'auction for',
        
        # Update actions
        'update auction', 'change auction', 'modify auction',
        'edit auction', 'update price', 'change price',
        
        # Delete actions
        'delete auction', 'remove auction', 'cancel auction',
        'close auction',
        
        # Schedule actions
        'schedule auction', 'set time', 'set date',
        'when should', 'schedule for',
    }

    DATABASE_INDICATORS = {
        'how many', 'how much', 'count', 'number of',
        'total', 'sum', 'average', 'median', 'min', 'max',
        'show', 'show me', 'list', 'display', 'find',
        'get', 'fetch', 'give me', 'tell me the',
        'customer', 'customers', 'buyer', 'buyers',
        'supplier', 'suppliers', 'vendor', 'vendors',
        'purchase', 'purchases', 'sale', 'sales',
        'transaction', 'order', 'invoice',
        'price', 'prices', 'cost', 'revenue',
        'quantity', 'amount', 'volume',
        'date', 'time', 'when', 'period',
        'region', 'location', 'area',
        'our', 'we', 'my', 'company',
        'by region', 'by date', 'by type', 'by standard',
        'group by', 'breakdown', 'categorize',
        'compare prices', 'compare sales', 'vs', 'versus',
        'top', 'bottom', 'highest', 'lowest', 'best', 'worst',
    }

    KNOWLEDGE_INDICATORS = {
        'what is', 'what are', 'what does', 'define',
        'explain', 'describe', 'tell me about',
        'health benefit', 'benefits', 'good for',
        'healthy', 'nutritional', 'nutrition',
        'how to', 'how should', 'how do i',
        'best way to', 'recommended way',
        'method', 'process', 'technique',
        'brew', 'brewing', 'steep', 'steeping',
        'prepare', 'preparation', 'make',
        'properties', 'characteristics', 'features',
        'flavor', 'flavour', 'taste', 'aroma',
        'quality', 'grade explanation',
        'history', 'historical', 'origin', 'originated',
        'traditional', 'culture', 'cultural',
        'famous for', 'known for',
        'difference between ceylon', 'compare assam',
        'what makes', 'why is', 'unique about',
        'geography', 'climate', 'weather',
        'grows', 'grown', 'cultivation',
        'harvested', 'produced', 'production process',
    }

    HYBRID_INDICATORS = {
        'tell me about our', 'explain our',
        'what is bopf and how much', 'what is op and show',
        'describe the tea and list',
    }

    @classmethod
    def classify(cls, question: str) -> QueryIntent:
        """
        Classify question intent.
        
        Returns:
            "auction_management" - Action commands for auctions
            "database" - Query transactional data
            "knowledge" - Search web for general info
            "hybrid" - Need both sources
        """
        q = question.lower().strip()
        
        # Check for auction actions FIRST (highest priority)
        if cls._is_auction_action(q):
            logger.info(f"[Intent] AUCTION_MANAGEMENT: {question[:60]}")
            return "auction_management"
        
        # Check hybrid
        if cls._contains_hybrid_indicators(q):
            logger.info(f"[Intent] HYBRID: {question[:60]}")
            return "hybrid"
        
        # Count indicators for database vs knowledge
        db_score = cls._count_matches(q, cls.DATABASE_INDICATORS)
        knowledge_score = cls._count_matches(q, cls.KNOWLEDGE_INDICATORS)
        
        logger.debug(f"[Intent] Scores - DB: {db_score}, Knowledge: {knowledge_score}")
        
        # Strong knowledge indicators override
        if knowledge_score > 0 and db_score == 0:
            logger.info(f"[Intent] KNOWLEDGE: {question[:60]}")
            return "knowledge"
        
        # Default to database if any data indicators present
        if db_score > 0:
            logger.info(f"[Intent] DATABASE: {question[:60]}")
            return "database"
        
        # Question structure
        if any(q.startswith(pattern) for pattern in ['what is', 'what are', 'why', 'how to']):
            logger.info(f"[Intent] KNOWLEDGE (by structure): {question[:60]}")
            return "knowledge"
        
        # Default to database
        logger.info(f"[Intent] DATABASE (default): {question[:60]}")
        return "database"

    @classmethod
    def _is_auction_action(cls, question: str) -> bool:
        """
        Detect if question is an auction action command.
        
        Examples:
        - "Create an auction for BOPF tea" → True
        - "Show my auctions" → False (this is a query, not action)
        - "Update auction #127 price to 600" → True
        """
        # Check for action keywords
        if any(keyword in question for keyword in cls.AUCTION_ACTION_KEYWORDS):
            # Additional check: "show/list my auctions" is a QUERY, not action
            if any(phrase in question for phrase in ['show my auction', 'list my auction', 'view my auction', 'display my auction']):
                return False
            return True
        
        return False

    @classmethod
    def _contains_hybrid_indicators(cls, question: str) -> bool:
        """Check if question needs both data and knowledge"""
        return any(indicator in question for indicator in cls.HYBRID_INDICATORS)

    @classmethod
    def _count_matches(cls, question: str, indicators: set) -> int:
        """Count how many indicators appear in question"""
        return sum(1 for indicator in indicators if indicator in question)


# Singleton instance
intent_classifier = IntentClassifier()