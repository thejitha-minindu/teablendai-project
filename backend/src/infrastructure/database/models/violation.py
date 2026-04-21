from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from src.infrastructure.database.connection import Base

class Violation(Base):
    __tablename__ = "violations"

    violation_id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(String)
    violator_id = Column(String)
    violation_type = Column(String)
    reason = Column(String)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)
