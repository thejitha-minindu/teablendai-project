from src.database import create_database_connection
from sqlalchemy import text

engine = create_database_connection()
with engine.connect() as conn:
    result = conn.execute(text("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'status'"))
    row = result.fetchone()
    if row:
        print(f"Status column found: {row[0]}, Type: {row[1]}, Nullable: {row[2]}")
    else:
        print("Status column not found")