from fastapi import APIRouter

router = APIRouter()

@router.get("/user")
def user_endpoint():
    pass