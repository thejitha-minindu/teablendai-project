from sqlalchemy.orm import Session
from src.infrastructure.database.models.violation import Violation
from src.presentation.routers.v1.admin import violation


# ✅ GET ALL VIOLATIONS
def get_all_violations(db: Session):
    violations = db.query(Violation).order_by(Violation.created_at.desc()).all()

    return [
        {
            "violation_id": v.violation_id,
            "senderId": v.sender_id,
            "violatorId": v.violator_id,
            "violationType": v.violation_type,
            "reason": v.reason,
            "status": v.status
        }
        for v in violations
    ]


# ✅ CREATE VIOLATION (for users)
def create_violation(db: Session, data: dict):
    violation = Violation(
        sender_id=data["sender_id"],
        violator_id=data["violator_id"],
        violation_type=data["violation_type"],
        reason=data["reason"],
    )

    db.add(violation)
    db.commit()
    db.refresh(violation)

    return {"message": "Violation submitted successfully"}