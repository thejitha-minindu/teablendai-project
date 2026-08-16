"""
Domain model for violations.

Re‑exports the canonical Violation model so both
``from src.domain.models.violation import Violation`` (used by __init__.py)
and
``from src.domain.models.violation_model import Violation`` (used by the repository)
resolve to the same class and SQLAlchemy mapper.
"""

from src.domain.models.violation_model import Violation, ViolationTypeEnum, ViolationStatusEnum

__all__ = ["Violation", "ViolationTypeEnum", "ViolationStatusEnum"]