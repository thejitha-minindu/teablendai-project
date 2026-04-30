import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .dependencies import get_mcp_client
from src.config import get_settings
from src.presentation.routers.v1.seller.auction import router as auction
from src.presentation.routers.v1 import (
    health, 
    bid, 
    user, 
    order,
    conversations, 
    query,
    #dashboard,
    chat,
    auth
)
from src.presentation.routers.v1.admin import admin_auction
from src.presentation.routers.v1.admin import admin_csv
from src.presentation.routers.v1.admin import admin_dashboard
from src.presentation.routers.v1.buyer import auction as buyer_auction 
from src.presentation.routers.v1.buyer import bid as buyer_bid
from src.presentation.routers.v1.buyer import order as buyer_order
from src.infrastructure.database.base import Base, engine, SessionLocal
from src.presentation.routers.v1 import auth
from src.presentation.routers.v1.admin import admin_csv, admin_auction, admin_dashboard
from src.application.use_cases.buyer.auction_manager import auction_manager
from src.application.use_cases.buyer.outbox_publisher import init_outbox_publisher, start_outbox_publisher, stop_outbox_publisher
from src.presentation.routers.v1.buyer import live_auction_socket

load_dotenv()

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("Windows event loop policy configured")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TeaBlendAI FastAPI server.")
    app.state.mcp_client = None

    # Start auction manager
    auction_manager_task = asyncio.create_task(auction_manager.start_background_task())
    app.state.auction_manager_task = auction_manager_task
    logger.info("Auction manager background task started")
    
    # Initialize and start outbox publisher
    init_outbox_publisher(SessionLocal)
    await start_outbox_publisher()
    logger.info("Outbox publisher started")

    if settings.INIT_DB_ON_STARTUP:
        try:
            # Explicitly import all models to ensure they are registered with Base.metadata before creating tables
            import src.domain.models
            import src.infrastructure.database.models.admin_tables_orm

            Base.metadata.create_all(bind=engine)
            logger.info("Database schema initialization completed on startup.")
        except Exception:
            logger.exception("Database schema initialization failed; continuing startup.")

    try:
        app.state.mcp_client = await get_mcp_client()
        logger.info("MCP client initialized during startup.")
    except Exception:
        logger.exception("MCP initialization failed at startup; continuing without warm MCP client.")

    try:
        yield
    finally:
        logger.info("Shutting down TeaBlendAI server")
        
        # Stop outbox publisher
        await stop_outbox_publisher()
        logger.info("Outbox publisher stopped")
        
        if hasattr(app.state, 'auction_manager_task'):
            auction_manager.stop()
            app.state.auction_manager_task.cancel()
            try:
                await app.state.auction_manager_task
            except asyncio.CancelledError:
                logger.debug("Auction manager task cancelled cleanly")
        
        mcp_client = getattr(app.state, "mcp_client", None)
        if mcp_client and mcp_client.is_ready():
            try:
                await mcp_client.shutdown()
                logger.info("MCP client shut down cleanly.")
            except asyncio.CancelledError:
                logger.debug("MCP shutdown cancelled (expected on Windows)")
            except Exception as e:
                if "cancel scope" not in str(e).lower():
                    logger.error(f"Error during MCP client shutdown: {e}")
                else:
                    logger.debug(f"MCP shutdown scope cancellation (expected): {e}")


# Create FastAPI application
app = FastAPI(
    title="TeaBlendAI API",
    description="Specialized AI assistant focused on tea-related topics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
settings = get_settings()
allowed_origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# API v1 routers

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
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

# Admin routers
app.include_router(admin_auction.router, prefix="/api/v1/admin", tags=["Admin"])

# Buyer routers
app.include_router(buyer_auction.router, prefix="/api/v1/buyer")
app.include_router(buyer_bid.router, prefix="/api/v1/buyer")
app.include_router(buyer_order.router, prefix="/api/v1/buyer")
app.include_router(live_auction_socket.router, prefix="/api/v1/buyer")

# WebSocket routers
app.include_router(live_auction_socket.router, prefix="/api/v1/buyer", tags=["buyer-live-auction-ws"])

# Admin routers
app.include_router(admin_csv.router, prefix="/api/v1/admin", tags=["csv-upload"])
app.include_router(admin_auction.router, prefix="/api/v1/admin", tags=["Admin Auctions"])
app.include_router(admin_dashboard.router, prefix="/api/v1/admin", tags=["Admin Dashboard"])

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": allowed_origins[0] if allowed_origins else "*",
            "Access-Control-Allow-Credentials": "true" if settings.CORS_ALLOW_CREDENTIALS else "false",
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.exception("Unhandled server error", exc_info=exc)
    origin = request.headers.get("origin")
    allow_origin = origin if origin in allowed_origins else (allowed_origins[0] if allowed_origins else "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true" if settings.CORS_ALLOW_CREDENTIALS else "false",
        },
    )

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
            "Real-time analytics",
            "Live auction timer with dynamic extension"
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
        "documentation": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )


# to run the app: uvicorn src.application.main:app --host 0.0.0.0 --port 8000
