"""
Tea Auction MCP Server

Wraps auction API to provide conversational auction management.
Acts as a thin adapter between chat service and existing REST APIs.
"""

import anyio
import json
import logging
from typing import Dict, Any, List

import httpx
from anyio import get_cancelled_exc_class
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.config import get_settings

settings = get_settings()

logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger("tea_auction_server")

server = Server("tea_auction")

API_PREFIX = settings.API_V1_PREFIX


def _candidate_base_urls() -> List[str]:
    """Build prioritized API base URL candidates for local self-calls."""
    candidates: List[str] = []

    explicit = getattr(settings, "AUCTION_API_BASE_URL", None)
    if explicit:
        candidates.append(str(explicit).rstrip("/"))

    candidates.extend([
        f"http://localhost:{settings.API_PORT}",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ])

    unique: List[str] = []
    for url in candidates:
        normalized = url.rstrip("/")
        if normalized not in unique:
            unique.append(normalized)
    return unique


async def _request_with_base_url_fallback(
    method: str,
    path: str,
    timeout: float,
    json_body: Dict[str, Any] = None,
    headers: Dict[str, str] = None,
):
    """Try request against multiple local API URLs until one is reachable."""
    last_error: Exception | None = None
    base_urls = _candidate_base_urls()
    
    # Merge headers with default content-type
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)

    for base_url in base_urls:
        url = f"{base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.request(
                    method,
                    url,
                    json=json_body,
                    headers=request_headers,
                )
                logger.info("[Auction] %s %s -> %s", method, url, response.status_code)
                return response
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            logger.warning("[Auction] %s failed (%s): %s", url, type(exc).__name__, exc)
            last_error = exc
            continue

    if last_error:
        raise last_error
    raise RuntimeError("No API base URLs available for auction request")


async def create_auction(
    user_id: str,
    grade: str,
    quantity: int,
    origin: str,
    base_price: float,
    start_time: str,
    duration: int,
    description: str = None,
) -> Dict[str, Any]:
    """
    Create a new auction via auction API.
    
    Args:
        user_id: Seller's user ID from authentication (JWT)
        grade: Tea grade (BOPF, Pekoe, etc.)
        quantity: Quantity in kg
        origin: Tea origin region
        base_price: Starting price for entire lot (LKR)
        start_time: Auction start datetime (YYYY-MM-DD HH:MM)
        duration: Auction duration in minutes
        description: Optional description
    
    Returns:
        Result dictionary with status and auction_id
    """
    try:
        logger.info("[Auction] Creating auction: %s %skg from %s (seller: %s)", grade, quantity, origin, user_id)

        # Core auction details only - backend will fetch seller info from user profile
        payload = {
            "auction_name": f"{grade} - {origin}",
            "seller_id": user_id,
            "seller_brand": "TeaBlend Seller",
            "company_name": "TeaBlend Seller",
            "estate_name": origin,
            "grade": grade,
            "quantity": quantity,
            "origin": origin,
            "base_price": base_price,
            "start_time": start_time,
            "duration": duration,
        }

        if description:
            payload["description"] = description

        logger.info("[Auction] Payload: %s", json.dumps(payload, indent=2, default=str))

        # Pass user_id via X-User-ID header for backend to extract seller profile
        headers = {
            "X-User-ID": user_id
        }

        response = await _request_with_base_url_fallback(
            method="POST",
            path=f"{API_PREFIX}/auctions",
            timeout=30.0,
            json_body=payload,
            headers=headers,
        )

        logger.info("[Auction] API response status: %s", response.status_code)

        if response.status_code in (200, 201):
            result = response.json()
            return {
                "status": "success",
                "message": "Auction created successfully",
                "auction_id": result.get("auction_id") or result.get("id"),
                "custom_auction_id": result.get("custom_auction_id"),
                "data": result,
            }

        return {
            "status": "error",
            "message": f"Failed to create auction: {response.text}",
            "status_code": response.status_code,
        }

    except httpx.TimeoutException:
        logger.error("[Auction] API timeout")
        return {"status": "error", "message": "Request timed out. Please try again."}
    except Exception as e:
        logger.error("[Auction] Error: %s", e, exc_info=True)
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}


async def get_auction_details(auction_id: str, user_id: str = None) -> Dict[str, Any]:
    """Get auction details by ID."""
    try:
        logger.info("[Auction] Fetching auction %s", auction_id)

        response = await _request_with_base_url_fallback(
            method="GET",
            path=f"{API_PREFIX}/auctions/{auction_id}",
            timeout=10.0,
        )

        if response.status_code == 200:
            data = response.json()

            if user_id and str(data.get("seller_id", "")) != str(user_id):
                return {
                    "status": "error",
                    "message": "Auction not found or access denied",
                    "status_code": 403,
                }

            return {"status": "success", "data": data}

        return {
            "status": "error",
            "message": "Auction not found or access denied",
            "status_code": response.status_code,
        }
    except Exception as e:
        logger.error("[Auction] Error fetching auction: %s", e)
        return {"status": "error", "message": str(e)}


async def update_auction(auction_id: str, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing auction."""
    try:
        auction = await get_auction_details(auction_id, user_id)
        if auction["status"] != "success":
            return auction

        auction_data = auction["data"]
        if auction_data.get("status") == "Live":
            return {"status": "error", "message": "Cannot update a Live auction"}

        merged_payload = {
            "auction_name": auction_data.get("auction_name") or f"{auction_data.get('grade')} - {auction_data.get('origin')}",
            "seller_id": str(auction_data.get("seller_id") or user_id),
            "seller_brand": auction_data.get("seller_brand") or "TeaBlend Seller",
            "company_name": auction_data.get("company_name") or "TeaBlend Seller",
            "estate_name": auction_data.get("estate_name") or auction_data.get("origin"),
            "grade": auction_data.get("grade"),
            "quantity": auction_data.get("quantity"),
            "origin": auction_data.get("origin"),
            "description": auction_data.get("description"),
            "base_price": auction_data.get("base_price"),
            "start_time": auction_data.get("start_time"),
            "duration": auction_data.get("duration"),
        }
        merged_payload.update(updates or {})

        response = await _request_with_base_url_fallback(
            method="PUT",
            path=f"{API_PREFIX}/auctions/{auction_id}",
            timeout=30.0,
            json_body=merged_payload,
        )

        if response.status_code == 200:
            return {
                "status": "success",
                "message": "Auction updated successfully",
                "data": response.json(),
            }

        return {
            "status": "error",
            "message": f"Failed to update auction: {response.text}",
            "status_code": response.status_code,
        }
    except Exception as e:
        logger.error("[Auction] Error updating auction: %s", e)
        return {"status": "error", "message": str(e)}


async def delete_auction(auction_id: str, user_id: str) -> Dict[str, Any]:
    """Delete an auction."""
    try:
        auction = await get_auction_details(auction_id, user_id)
        if auction["status"] != "success":
            return auction

        auction_data = auction["data"]
        if auction_data.get("status") == "Live":
            return {"status": "error", "message": "Cannot delete a Live auction"}

        logger.info("[Auction] Deleting auction %s", auction_id)

        response = await _request_with_base_url_fallback(
            method="DELETE",
            path=f"{API_PREFIX}/auctions/{auction_id}",
            timeout=30.0,
        )

        if response.status_code in (200, 204):
            return {"status": "success", "message": "Auction deleted successfully"}

        return {
            "status": "error",
            "message": f"Failed to delete auction: {response.text}",
            "status_code": response.status_code,
        }
    except Exception as e:
        logger.error("[Auction] Error deleting auction: %s", e)
        return {"status": "error", "message": str(e)}


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available auction management tools."""
    return [
        Tool(
            name="create_auction",
            description="Create a new tea auction",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "Seller's user ID from authentication"},
                    "grade": {"type": "string", "description": "Tea grade (BOP, BOPF, OP, Pekoe, etc.)"},
                    "quantity": {"type": "integer", "description": "Quantity in kilograms"},
                    "origin": {"type": "string", "description": "Tea origin region"},
                    "base_price": {"type": "number", "description": "Starting bid price (LKR)"},
                    "start_time": {"type": "string", "description": "Auction start time (YYYY-MM-DD HH:MM)"},
                    "duration": {"type": "integer", "description": "Duration in minutes"},
                    "description": {"type": "string", "description": "Optional description"},
                },
                "required": ["user_id", "grade", "quantity", "origin", "base_price", "start_time", "duration"],
            },
        ),
        Tool(
            name="get_auction",
            description="Get auction details by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "auction_id": {"type": "string", "description": "Auction ID"},
                    "user_id": {"type": "string", "description": "User ID"},
                },
                "required": ["auction_id"],
            },
        ),
        Tool(
            name="update_auction",
            description="Update an existing auction",
            inputSchema={
                "type": "object",
                "properties": {
                    "auction_id": {"type": "string", "description": "Auction ID to update"},
                    "user_id": {"type": "string", "description": "User ID for ownership validation"},
                    "updates": {"type": "object", "description": "Fields to update"},
                },
                "required": ["auction_id", "user_id", "updates"],
            },
        ),
        Tool(
            name="delete_auction",
            description="Delete an auction",
            inputSchema={
                "type": "object",
                "properties": {
                    "auction_id": {"type": "string", "description": "Auction ID to delete"},
                    "user_id": {"type": "string", "description": "User ID for ownership validation"},
                },
                "required": ["auction_id", "user_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        if name == "create_auction":
            # user_id is required and must come from JWT authentication
            if "user_id" not in arguments:
                return [
                    TextContent(
                        type="text",
                        text=json.dumps({"status": "error", "message": "user_id is required for auction creation"}),
                    )
                ]
            result = await create_auction(
                user_id=arguments["user_id"],
                grade=arguments["grade"],
                quantity=arguments["quantity"],
                origin=arguments["origin"],
                base_price=arguments["base_price"],
                start_time=arguments["start_time"],
                duration=arguments["duration"],
                description=arguments.get("description"),
            )
        elif name == "get_auction":
            result = await get_auction_details(
                auction_id=arguments["auction_id"],
                user_id=arguments.get("user_id"),
            )
        elif name == "update_auction":
            result = await update_auction(
                auction_id=arguments["auction_id"],
                user_id=arguments["user_id"],
                updates=arguments["updates"],
            )
        elif name == "delete_auction":
            result = await delete_auction(
                auction_id=arguments["auction_id"],
                user_id=arguments["user_id"],
            )
        else:
            result = {"status": "error", "message": f"Unknown tool: {name}"}

        return [TextContent(type="text", text=json.dumps(result, default=str))]

    except Exception as e:
        logger.error("[Auction] Tool error: %s", e, exc_info=True)
        return [
            TextContent(
                type="text",
                text=json.dumps({"status": "error", "message": str(e)}),
            )
        ]


async def main():
    """Run the MCP auction server."""
    logger.info("tea_auction MCP server started (stdio).")

    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                initialization_options=server.create_initialization_options(),
            )
    except get_cancelled_exc_class():
        pass


if __name__ == "__main__":
    anyio.run(main)
