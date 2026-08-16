from pydantic import BaseModel

class UserVerification(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    default_role: str
    verification_status: str