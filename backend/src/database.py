# Database utilities

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends
from dotenv import load_dotenv
import os
    
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    echo=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
