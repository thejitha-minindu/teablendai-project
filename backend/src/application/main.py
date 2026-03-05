import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("Windows event loop policy configured")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .dependencies import get_mcp_client
from src.config import get_settings
from src.presentation.routers.v1 import (
    health, 
    bid, 
    auction, 
    user, 
    order,
    conversations, 
    query,
    #dashboard,
    chat
)
from src.presentation.routers.v1.buyer import auction as buyer_auction, bid as buyer_bid, order as buyer_order
from src.infrastructure.database.base import Base, engine
from src.presentation.routers.v1 import auth
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     logger.info("Starting TeaBlendAI FastAPI server.")
#     app.state.mcp_client = None

#     try:
#         app.state.mcp_client = await get_mcp_client()
#         logger.info("MCP client initialized during startup.")
#     except Exception:
#         logger.exception("MCP initialization failed at startup; continuing without warm MCP client.")

#     try:
#         yield
#     finally:
#         logger.info("Shutting down TeaBlendAI server")
#         mcp_client = getattr(app.state, "mcp_client", None)
#         if mcp_client and mcp_client.is_ready():
#             try:
#                 await mcp_client.shutdown()
#                 logger.info("MCP client shut down cleanly.")
#             except asyncio.CancelledError:
#                 logger.debug("MCP shutdown cancelled (expected on Windows)")
#             except Exception as e:
#                 # Filter out harmless scope cancellation errors common on Windows
#                 if "cancel scope" not in str(e).lower():
#                     logger.error(f"Error during MCP client shutdown: {e}")
#                 else:
#                     logger.debug(f"MCP shutdown scope cancellation (expected): {e}")


# Create FastAPI application
app = FastAPI(
    title="Tea Auction Platform",
    description="Backend API for TeaBlendAI",
    version="1.0.0",
    # lifespan=lifespan
)

# CORS setup
settings = get_settings()
allowed_origins = settings.CORS_ORIGINS

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
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

# API v1 routers - Chatbot
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(conversations.router, prefix="/api/v1", tags=["Conversations"])
app.include_router(query.router, prefix="/api/v1", tags=["Query"])
#app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])

# Buyer-specific endpoints (with /buyer prefix)
app.include_router(buyer_auction.router, prefix="/api/v1/buyer", tags=["buyer-auctions"])
app.include_router(buyer_bid.router, prefix="/api/v1/buyer", tags=["buyer-bids"])
app.include_router(buyer_order.router, prefix="/api/v1/buyer", tags=["buyer-orders"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "TeaBlendAI API",
        "description": "Specialized AI assistant for tea-related queries with chatbot",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "Tea auction management",
            "AI-powered chatbot",
            "MCP tool integration",
            "Real-time analytics"
        ]
    }

@app.get("/api/v1/info")
async def api_info():
    """API information endpoint."""
    return {
        "api_version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "chat": "/api/v1/chat",
            "auctions": "/api/v1/auctions",
            "bids": "/api/v1/bids",
            "users": "/api/v1/users",
            "orders": "/api/v1/orders",
            "conversations": "/api/v1/conversations",
            "dashboard": "/api/v1/dashboard"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    
    
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=5000,
        log_level="info"
    )


# to run the app: uvicorn src.application.main:app --reload