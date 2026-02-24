"""
Query Intent Classifier

Determines whether a question should be answered by:
- Database (transactional data)
- Web search (general knowledge)
- Both (hybrid)
"""

import logging
from typing import Literal

logger = logging.getLogger(__name__)

QueryIntent = Literal["database", "knowledge", "hybrid"]


class IntentClassifier:
    """Classify user queries by intent"""

    # Keywords that strongly indicate database query
    DATABASE_INDICATORS = {
        # Quantitative questions
        'how many', 'how much', 'count', 'number of',
        'total', 'sum', 'average', 'median', 'min', 'max',
        
        # Data retrieval
        'show', 'show me', 'list', 'display', 'find',
        'get', 'fetch', 'give me', 'tell me the',
        
        # Business entities in YOUR system
        'customer', 'customers', 'buyer', 'buyers',
        'supplier', 'suppliers', 'vendor', 'vendors',
        'purchase', 'purchases', 'sale', 'sales',
        'transaction', 'order', 'invoice',
        
        # Data attributes
        'price', 'prices', 'cost', 'revenue',
        'quantity', 'amount', 'volume',
        'date', 'time', 'when', 'period',
        'region', 'location', 'area',
        
        # Possessive (indicates YOUR data)
        'our', 'we', 'my', 'company',
        
        # Aggregations
        'by region', 'by date', 'by type', 'by standard',
        'group by', 'breakdown', 'categorize',
        
        # Comparisons of data points
        'compare prices', 'compare sales', 'vs', 'versus',
        'difference between prices', 'which customer',
        'top', 'bottom', 'highest', 'lowest', 'best', 'worst',
    }

    # Keywords that strongly indicate knowledge query
    KNOWLEDGE_INDICATORS = {
        # Educational/informational
        'what is', 'what are', 'what does', 'define',
        'explain', 'describe', 'tell me about',
        
        # Health & benefits
        'health benefit', 'benefits', 'good for',
        'healthy', 'nutritional', 'nutrition',
        
        # Methods & processes
        'how to', 'how should', 'how do i',
        'best way to', 'recommended way',
        'method', 'process', 'technique',
        'brew', 'brewing', 'steep', 'steeping',
        'prepare', 'preparation', 'make',
        
        # Properties & characteristics
        'properties', 'characteristics', 'features',
        'flavor', 'flavour', 'taste', 'aroma',
        'quality', 'grade explanation',
        
        # History & culture
        'history', 'historical', 'origin', 'originated',
        'traditional', 'culture', 'cultural',
        'famous for', 'known for',
        
        # Comparisons of concepts
        'difference between ceylon', 'compare assam',
        'difference between oolong', 'what makes',
        'why is', 'unique about',
        
        # General facts
        'geography', 'climate', 'weather',
        'grows', 'grown', 'cultivation',
        'harvested', 'produced', 'production process',
    }

    # Hybrid indicators (need both sources)
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
            "database" - Query transactional data
            "knowledge" - Search web for general info
            "hybrid" - Need both sources
        """
        q = question.lower().strip()
        
        # Check hybrid first (most specific)
        if cls._contains_hybrid_indicators(q):
            logger.info(f"[Intent] HYBRID: {question[:60]}")
            return "hybrid"
        
        # Count indicators for each type
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
        
        # If no clear indicators, check question structure
        # Questions starting with "what is/are" without data terms = knowledge
        if any(q.startswith(pattern) for pattern in ['what is', 'what are', 'why', 'how to']):
            logger.info(f"[Intent] KNOWLEDGE (by structure): {question[:60]}")
            return "knowledge"
        
        # Default to database (safer to try data first, can fallback)
        logger.info(f"[Intent] DATABASE (default): {question[:60]}")
        return "database"

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