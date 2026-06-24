import sys
import os
from sqlalchemy import text
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.infrastructure.database.base import SessionLocal

def main():
    db = SessionLocal()
    r = db.execute(text("SELECT * FROM auctions WHERE auction_id='C03E5DCA-85DC-4DBE-A04B-4A0C30200C3F'")).first()
    if r:
        print(dict(r._mapping))
    else:
        print("Not found")
    db.close()

if __name__ == "__main__":
    main()
