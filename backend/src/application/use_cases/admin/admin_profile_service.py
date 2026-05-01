from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.models.admin import Admin

def get_admin_profile(db: Session, admin_id: str):
    admin = db.query(Admin).filter(Admin.admin_id == str(admin_id)).first()

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    return {
        "admin_id": admin.admin_id,
        "username": admin.username,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "role": admin.role,
        "joined_date": admin.joined_date.isoformat() if admin.joined_date else None,
        "last_login": admin.last_login.isoformat() if admin.last_login else None,
        "status": admin.status
    }
def update_admin_profile(db: Session, admin_id: str, data: dict):
    admin = db.query(Admin).filter(Admin.admin_id == str(admin_id)).first()

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if "username" in data:
        admin.username = data["username"]
    if "email" in data:
        admin.email = data["email"]
    if "first_name" in data:
        admin.first_name = data["first_name"]
    if "last_name" in data:
        admin.last_name = data["last_name"]
    if "role" in data:
        admin.role = data["role"]

    db.commit()
    db.refresh(admin)

    return {"message": "Profile updated successfully"}