import sys
import os

# Add the src directory to the path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.database import get_engine
from sqlalchemy import text, inspect

def add_missing_columns():
    engine = get_engine()
    inspector = inspect(engine)
    
    # Check if violations table exists
    if "violations" not in inspector.get_table_names():
        print("Table 'violations' does not exist yet.")
        return

    existing_columns = {col["name"] for col in inspector.get_columns("violations")}
    
    with engine.begin() as conn:
        if "auction_id" not in existing_columns:
            print("Adding column auction_id to violations...")
            try:
                conn.execute(text("ALTER TABLE violations ADD auction_id VARCHAR(255) NULL"))
                print("Missing column added successfully.")
            except Exception as e:
                print(f"Error adding column: {e}")
        else:
            print("Column auction_id already exists in violations.")

if __name__ == "__main__":
    add_missing_columns()
