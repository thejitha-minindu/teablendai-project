import sys
import os
from uuid import uuid4
from datetime import date, datetime

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.infrastructure.database.base import SessionLocal
from src.domain.models.admin import Admin
from src.application.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_email = "admin@teablendai.com"
        existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
        
        if existing_admin:
            print(f"Admin with email {admin_email} already exists.")
            return

        # Create default admin
        new_admin = Admin(
            admin_id=str(uuid4()),
            username="admin",
            email=admin_email,
            password=get_password_hash("admin123"),
            first_name="System",
            last_name="Admin",
            role="superadmin",
            joined_date=date.today(),
            status="active"
        )
        
        db.add(new_admin)
        db.commit()
        print(f"Default admin account created successfully!")
        print(f"Email: {admin_email}")
        print(f"Username: admin")
        print(f"Password: admin123")
        
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
