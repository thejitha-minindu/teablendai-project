from fastapi import APIRouter

router = APIRouter()

@router.get("/order")
def order_endpoint():
    pass