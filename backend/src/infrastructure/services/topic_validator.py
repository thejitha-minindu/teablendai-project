"""
Topic Validator - Structure-based validation.
"""

import re
import logging
from typing import List, Set, Optional

logger = logging.getLogger(__name__)


class TopicValidator:

    # Core tea terms
    PRIMARY_TEA_TERMS: Set[str] = {
        'tea', 'teas', 'chai', 'cha',
        'blend', 'blends', 'blending',
        'ceylon', 'assam', 'darjeeling', 'earl grey',
        'green tea', 'black tea', 'white tea', 'oolong',
        'herbal tea', 'rooibos', 'matcha', 'sencha',
        'bop', 'bopf', 'op', 'pekoe', 'fannings', 'dust',
        'fbop', 'op1', 'souchong', 'broken',
        'estate', 'plantation', 'garden',
        'harvest', 'plucking', 'withering', 'rolling',
        'fermentation', 'oxidation', 'drying',
        'brew', 'brewing', 'steep', 'steeping', 
        'infusion', 'teapot', 'kettle',
        'temperature', 'hot', 'boil', 'boiling',  
        'auction', 'grade', 'premium',
        'flavor', 'flavour', 'taste', 'aroma', 'liquor',
    }

    # Business terms
    BUSINESS_TERMS: Set[str] = {
        'customer', 'customers',
        'supplier', 'suppliers',
        'buyer', 'buyers',
        'seller', 'sellers',
        'vendor', 'vendors',
        'price', 'prices', 'pricing',
        'sale', 'sales', 'sold',
        'purchase', 'purchases', 'bought',
        'quantity', 'quantities',
        'inventory', 'stock',
        'export', 'import', 'trade', 'trading',
        'revenue', 'profit', 'cost', 'margin', 'value',
        'quality', 'standard', 'standards',
        'broker', 'brokers',
    }

    # Data manipulation starters
    DATA_STARTERS: List[str] = [
        'show me', 'show all', 'show the',
        'give me', 'give all',
        'list', 'list all', 'list the',
        'display', 'find', 'fetch', 'get',
        'sort by', 'order by',
        'filter by', 'filter',
        'group by', 'group',
        'count', 'how many', 'how much',
        'what is the total', 'what is the average',
        'what is the count', 'what is the sum',
        'compare', 'breakdown', 'summarize',
        'top ', 'bottom ', 'first ', 'last ',
    ]

    # Follow-up references
    FOLLOWUP_REFERENCES: List[str] = [
        'their', 'them', 'those', 'these',
        'the same', 'also show', 'also give',
        'more details', 'more info', 'tell me more',
        'what about', 'and their', 'and the',
    ]

    # Location patterns to strip
    LOCATION_PATTERNS: List[str] = [
        r'\bin\s+sri\s+lanka\b',
        r'\bfrom\s+sri\s+lanka\b',
        r'\bof\s+sri\s+lanka\b',
        r'\bin\s+india\b',
        r'\bin\s+china\b',
        r'\bin\s+kenya\b',
        r'\bin\s+japan\b',
        r'\bin\s+nuwara\s+eliya\b',
        r'\bin\s+kandy\b',
        r'\bin\s+colombo\b',
        r'\bin\s+dimbula\b',
        r'\bin\s+uva\b',
        r'\bin\s+badulla\b',
        r'\bin\s+galle\b',
        r'\bin\s+matale\b',
        r'\bin\s+ratnapura\b',
    ]

    # OFF-TOPIC INDICATORS - ONLY clearly non-tea topics
    OFF_TOPIC_INDICATORS: Set[str] = {
        # Programming
        'programming language', 'python programming', 'javascript',
        'coding language', 'software development',
        
        # Sports
        'football', 'cricket', 'cricketer', 'basketball', 'rugby',
        'player', 'athlete', 'match score',
        
        # Entertainment
        'movie', 'film', 'music', 'song',
        
        # Politics
        'president', 'prime minister', 'election',
        
        # General
        'capital city', 'country population',
    }

    def _strip_location_qualifiers(self, question: str) -> str:
        """Remove location phrases"""
        result = question
        for pattern in self.LOCATION_PATTERNS:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        return result.strip()

    def _is_data_followup(self, question: str) -> bool:
        """Check if question is a data follow-up"""
        q = question.lower().strip()

        if any(q.startswith(s) or s in q for s in self.DATA_STARTERS):
            return True

        if any(ref in q for ref in self.FOLLOWUP_REFERENCES):
            return True

        if len(q.split()) <= 5:
            return True

        return False

    def is_tea_related(
        self,
        question: str,
        has_conversation_history: bool = False,
        conversation_id: Optional[int] = None
    ) -> bool:
        """Validate question relevance"""
        q = question.lower().strip()

        # Hard reject ONLY clearly off-topic
        if any(indicator in q for indicator in self.OFF_TOPIC_INDICATORS):
            logger.warning(f"[Validator] HARD REJECT off-topic: {question[:60]}")
            return False

        # Follow-ups
        if has_conversation_history and self._is_data_followup(q):
            logger.debug(f"[Validator] Follow-up allowed: {question[:60]}")
            return True

        # Strip location qualifiers
        core = self._strip_location_qualifiers(q)
        logger.debug(f"[Validator] Core after stripping: '{core[:80]}'")

        # Check PRIMARY tea terms
        if any(term in core for term in self.PRIMARY_TEA_TERMS):
            logger.debug(f"[Validator] Tea term found: {question[:60]}")
            return True

        # Check business terms
        if any(term in core for term in self.BUSINESS_TERMS):
            logger.debug(f"[Validator] Business term found: {question[:60]}")
            return True

        logger.warning(f"[Validator] REJECTED (off-topic): {question[:60]}")
        return False

    @classmethod
    def get_rejection_message(cls, question: str = None) -> str:
        return (
            "I'm specialized in tea industry analytics and can only answer "
            "questions related to:\n\n"
            "• Tea types, blends, and grades\n"
            "• Tea pricing and sales\n"
            "• Tea production and quality\n"
            "• Tea brewing and preparation\n"
            "• Tea auctions and trading\n"
            "• Tea industry data and analytics\n\n"
            "Please ask a tea-related question!"
        )

    @classmethod
    def get_suggestions(cls, question: str = None) -> List[str]:
        return [
            "How many tea blends do we have?",
            "What is the average price of BOPF tea?",
            "What's the best brewing temperature for Ceylon tea?",
            "Show me the top 10 customers by purchase volume",
            "Compare prices of BOP vs BOPF",
            "Which region has the most customers?",
        ]


# Singleton
topic_validator = TopicValidator()