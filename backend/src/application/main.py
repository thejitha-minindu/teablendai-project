
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.presentation.routers.v1 import health

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
app.include_router(health.router, prefix="/api/v1")


# to run the app: uvicorn src.application.main:app --reload