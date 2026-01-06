
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.presentation.routers.v1 import health, bid, auction, user, order

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# CORS setup
origins = [
    "http://localhost:3000",
    "http://frontend:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routers

# Register bid router
app.include_router(bid.router, prefix="/api/v1")
# Register auction router
app.include_router(auction.router, prefix="/api/v1")
# Register user router
app.include_router(user.router, prefix="/api/v1")
# Register order router
app.include_router(order.router, prefix="/api/v1")
# Register health check router
app.include_router(health.router, prefix="/api/v1")


# to run the app: uvicorn src.application.main:app --reload