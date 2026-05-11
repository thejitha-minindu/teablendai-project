import sys
import os

# Add the src directory to the path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.database import get_engine
from sqlalchemy import text, inspect

def add_missing_columns():
    engine = get_engine()
    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns("users")}
    
    columns_to_add = [
        ("seller_name", "VARCHAR(256)"),
        ("seller_registration_no", "VARCHAR(128)"),
        ("seller_started_year", "INT"),
        ("seller_website", "VARCHAR(256)"),
        ("seller_description", "VARCHAR(MAX)"),
        ("seller_street_address", "VARCHAR(512)"),
        ("seller_province", "VARCHAR(128)"),
        ("seller_city", "VARCHAR(128)"),
        ("seller_postal_code", "VARCHAR(32)"),
        ("seller_verification_status", "VARCHAR(16)"),
        ("seller_rejection_reason", "VARCHAR(512)"),
        ("seller_requested_at", "DATETIME"),
        ("seller_approved_at", "DATETIME"),
    ]
    
    with engine.begin() as conn:
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                print(f"Adding column {col_name}...")
                conn.execute(text(f"ALTER TABLE users ADD {col_name} {col_type} NULL"))
        
        print("Missing columns added successfully.")

if __name__ == "__main__":
    add_missing_columns()
