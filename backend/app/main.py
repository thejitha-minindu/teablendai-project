from fastapi import FastAPI
from app.routers import admin_csv
from app.services import admin_csv
from .services import admin_csv
app = FastAPI(title="TeaBlend AI Admin Backend")

# Include routers
app.include_router(admin_csv.router)


@app.get("/health")
def health():
    return {"status": "ok"}