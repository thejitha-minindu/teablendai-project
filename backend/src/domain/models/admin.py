from sqlalchemy import Column, String, Date, DateTime
from src.infrastructure.database.connection import Base

class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(String, primary_key=True)
    username = Column(String)
    email = Column(String)
    password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(String)
    joined_date = Column(Date)
    last_login = Column(DateTime)
    status = Column(String)