import asyncio
from src.infrastructure.database.connection import SessionLocal
from sqlalchemy import text

def check_alembic():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        for row in result:
            print("Current Alembic Version:", row[0])
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check_alembic()
