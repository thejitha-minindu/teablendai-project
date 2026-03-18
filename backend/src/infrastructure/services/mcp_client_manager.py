"""
MCP Client Manager

High-level wrapper for MCP server communication.
Manages connections to tea_database, tea_search, tea_visualization, and tea_auction servers.
"""

import sys
import asyncio
import json
import logging
import os

from typing import Dict, List, Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger(__name__)

class MCPClientManager:
    """
    Manager for all MCP server connections
    
    Handles communication with:
    - tea_database: SQL query execution
    - tea_search: Web search via Tavily
    - tea_visualization: Chart generation with Plotly
    - tea_auction: Auction CRUD via API adapter
    """
    
    def __init__(self):
        self.sessions: Dict[str, ClientSession] = {}
        self.context_managers: Dict[str, Any] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize connections to MCP servers"""

        if self._initialized:
            logger.warning("MCP Client already initialized")
            return
        
        logger.info("Initializing MCP servers...")

        targets = [
            ("tea_database", "src.infrastructure.services.mcp.tea_database.server"),
            ("tea_visualization", "src.infrastructure.services.mcp.tea_visualization.server"),
            ("tea_search", "src.infrastructure.services.mcp.tea_search.server"),
            ("tea_auction", "src.infrastructure.services.mcp.tea_auction.server"),
        ]
        failed_servers: List[str] = []

        for server_name, module_path in targets:
            try:
                await self._connect_server(server_name, module_path)
            except Exception:
                failed_servers.append(server_name)
                logger.exception(f"Failed to initialize MCP server: {server_name}")

        self._initialized = True

        if failed_servers:
            logger.warning(
                "MCP initialized in degraded mode. Failed servers: %s",
                ", ".join(failed_servers),
            )

        if self.sessions:
            logger.info("Connected MCP servers: %s", ", ".join(self.sessions.keys()))
        else:
            logger.warning("No MCP servers connected. API will continue without MCP capabilities.")

    async def _connect_server(self, server_name: str, module_path: str):
        """Connect to a specific MCP server"""

        try:
            logger.info(f"Connecting to {server_name}...")
            
            # Create server parameters
            server_params = StdioServerParameters(
                command=sys.executable,
                args=["-m", module_path],
                env=os.environ.copy()
            )

            # Create stdio connection
            context_manager = stdio_client(server_params)
            read_stream, write_stream = await context_manager.__aenter__()
            
            # Create session
            session = ClientSession(read_stream, write_stream)
            await session.__aenter__()
            await session.initialize()
            
            # Store references
            self.sessions[server_name] = session
            self.context_managers[server_name] = context_manager
            
            logger.info(f"{server_name} connected successfully")
        except Exception as e:
            logger.exception(f"Error connecting to {server_name}")
            raise

    async def shutdown(self):
        """Shutdown all MCP server connections"""
        logger.info("Shutting down MCP servers...")
        
        # Close sessions
        for name, session in self.sessions.items():
            try:
                await session.__aexit__(None, None, None)
                logger.info(f"Closed {name} session")
            except asyncio.CancelledError:
                logger.debug(f"Session close cancelled for {name} (expected)")
            except Exception as e:
                if "cancel scope" in str(e).lower():
                    logger.debug(f"Cancel scope error closing {name} (harmless)")
                else:
                    logger.warning(f"Error closing {name} session: {e}")
        
        # Close transports
        for name, context_manager in self.context_managers.items():
            try:
                await context_manager.__aexit__(None, None, None)
                logger.info(f"Closed {name} transport")
            except asyncio.CancelledError:
                logger.debug(f"Transport close cancelled for {name} (expected)")
            except Exception as e:
                if "cancel scope" in str(e).lower():
                    logger.debug(f"Cancel scope error closing {name} transport (harmless)")
                else:
                    logger.warning(f"Error closing {name} transport: {e}")
        
        self._initialized = False
        logger.info("MCP servers shutdown complete")

    # DATABASE SERVER METHODS
    async def query_database(self, question: str) -> Dict[str, Any]:
        """Query the tea database using natural language"""
        try:
            session = self.sessions.get("tea_database")
            if not session:
                raise RuntimeError("Database server not connected")
            
            logger.info(f"[DB] Querying: {question}")
            
            # Call the query_tea_data tool
            result = await asyncio.wait_for(
                session.call_tool(
                    "query_tea_data",
                    arguments={"query": question}
                ),
                timeout=30.0
            )
            
            # Parse response
            if result.content:
                text_content = result.content[0].text

                logger.info(f"[DB] Raw response (first 200 chars): {text_content[:200]}")

                try:
                    data = json.loads(text_content)
                except json.JSONDecodeError as e:
                    logger.warning(f"[DB] JSON parse error: {e}, attempting recovery...")

                    # Try to extract first valid JSON object
                    import re
                    # Find first complete JSON object
                    json_match = re.search(r'\{.*\}', text_content, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group())
                        logger.info("[DB] JSON recovered successfully")
                    else:
                        logger.error(f"[DB] Cannot parse response: {text_content[:500]}")
                        return {
                            "success": False,
                            "error": f"Invalid JSON response: {text_content[:100]}",
                            "has_data": False
                        }
                
                # normalize to your ChatService expectations
                data["success"] = (data.get("status") == "success")
                data["has_data"] = bool(data.get("raw_data"))
                data["data"] = data.get("raw_data", [])
                data["sql_query"] = data.get("sql_query") 
                
                logger.info(f"[DB] Success: {data.get('answer', 'No answer')}")
                return data
            else:
                logger.warning("[DB] No content in response")
                return {
                    "success": False,
                    "answer": "No results returned",
                    "has_data": False
                }
        
        except asyncio.TimeoutError:
            logger.error("[DB] Query timeout")
            return {
                "success": False,
                "error": "Database query timed out",
                "has_data": False
            }
        
        except Exception as e:
            logger.error(f"[DB] Error: {e}")
            return {
                "success": False,
                "error": str(e),
                "has_data": False
            }
 
    # SEARCH SERVER METHODS
    async def search_web(self, query: str) -> Dict[str, Any]:
        """Search the web for tea-related information"""
        try:
            session = self.sessions.get("tea_search")
            if not session:
                raise RuntimeError("Search server not connected")
            
            logger.info(f"[Search] Querying: {query}")
            
            # Call the search_web tool
            result = await asyncio.wait_for(
                session.call_tool(
                    "search_web",
                    arguments={"query": query}
                ),
                timeout=30.0
            )
            
            # Parse response
            if result.content:
                text_content = result.content[0].text
                logger.info(f"[SEARCH] Raw response (first 200 chars): {text_content[:200]}")

                try:
                    data = json.loads(text_content)
                except json.JSONDecodeError as e:
                    logger.error(f"[SEARCH] JSON parse error: {e}")
                    logger.error(f"[SEARCH] Raw content: {text_content[:500]}")
                    return {
                        "success": False,
                        "error": f"Invalid JSON from MCP search server",
                        "results": [],
                        "has_data": False
                    }
                
                data["success"] = (data.get("status") == "success")
                data["has_data"] = bool(data.get("raw_data"))
                data["data"] = data.get("raw_data", [])
                data["sql_query"] = data.get("sql_query") 
                
                logger.info(f"[SEARCH] Result: {data.get('summary', 'No summary')}")
                return data
            else:
                logger.warning("[SEARCH] No content in response")
                return {
                    "success": False,
                    "answer": "No results found",
                    "results": []
                }
        except asyncio.TimeoutError:
            logger.error("[SEARCH] Search timeout")
            return {
                "success": False,
                "error": "Web search timed out",
                "results": []
            }
        
        except Exception as e:
            logger.error(f"[SEARCH] error {e}")
            return {
                "success": False,
                "error": str(e),
                "results": []
            }
        
    # VISUALIZATION SERVER METHODS
    async def create_visualization(
            self, 
            data: List[Dict], 
            query: str = "",
            chart_type: str = None
        ) -> Dict[str, Any]:

        """Create a visualization from data"""
        try:
            session = self.sessions.get("tea_visualization")
            if not session:
                raise RuntimeError("Visualization server not connected")
            
            logger.info(f"[VIZ] Creating visualization for {len(data)} rows")

            arguments = {"data": data, "query": query}
            if chart_type:
                arguments["chart_type"] = chart_type
                logger.info(f"[VIZ] Forcing chart type: {chart_type}")

            # Call the create_visualization tool
            result = await asyncio.wait_for(
                session.call_tool(
                    "create_visualization",
                    arguments=arguments
                ),
                timeout=15.0
            )

            # Parse response
            if result.content:
                text_content = result.content[0].text
                viz_data = json.loads(text_content)
                viz_data['success'] = True
                
                logger.info(f"[VIZ] Success: Created {viz_data.get('visualization_type', 'unknown')} chart")
                return viz_data
            else:
                logger.warning("[VIZ] No content in response")
                return {
                    "success": False,
                    "error": "No visualization generated"
                }
        except asyncio.TimeoutError:
            logger.error("[VIZ] Visualization timeout")
            return {
                "success": False,
                "error": "Visualization timed out"
            }
        
        except Exception as e:
            logger.error(f"[VIZ] Error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # AUCTION SERVER METHODS
    async def create_auction(
        self,
        user_id: str,
        grade: str,
        quantity: int,
        origin: str,
        base_price: float,
        start_time: str,
        duration: int,
        description: str = None
    ) -> Dict[str, Any]:
        """Create auction via MCP auction server."""
        try:
            session = self.sessions.get("tea_auction")
            if not session:
                raise RuntimeError("Auction server not connected")

            arguments = {
                "user_id": user_id,
                "grade": grade,
                "quantity": quantity,
                "origin": origin,
                "base_price": base_price,
                "start_time": start_time,
                "duration": duration
            }
            if description:
                arguments["description"] = description

            result = await asyncio.wait_for(
                session.call_tool("create_auction", arguments=arguments),
                timeout=30.0
            )

            if result.content:
                return json.loads(result.content[0].text)

            return {
                "status": "error",
                "message": "No response from auction server"
            }
        except asyncio.TimeoutError:
            logger.error("[AUCTION] Creation timeout")
            return {
                "status": "error",
                "message": "Auction creation timed out"
            }
        except Exception as e:
            logger.error(f"[AUCTION] Error: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def get_auction_details(
        self,
        auction_id: str,
        user_id: str = None
    ) -> Dict[str, Any]:
        """Get auction details via MCP auction server."""
        try:
            session = self.sessions.get("tea_auction")
            if not session:
                raise RuntimeError("Auction server not connected")

            result = await asyncio.wait_for(
                session.call_tool(
                    "get_auction",
                    arguments={"auction_id": auction_id, "user_id": user_id}
                ),
                timeout=10.0
            )

            if result.content:
                return json.loads(result.content[0].text)

            return {
                "status": "error",
                "message": "No response"
            }
        except Exception as e:
            logger.error(f"[AUCTION] Error getting details: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def delete_auction(
        self,
        auction_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Delete auction via MCP auction server."""
        try:
            session = self.sessions.get("tea_auction")
            if not session:
                raise RuntimeError("Auction server not connected")

            result = await asyncio.wait_for(
                session.call_tool(
                    "delete_auction",
                    arguments={"auction_id": auction_id, "user_id": user_id}
                ),
                timeout=30.0
            )

            if result.content:
                return json.loads(result.content[0].text)

            return {
                "status": "error",
                "message": "No response"
            }
        except Exception as e:
            logger.error(f"[AUCTION] Error deleting: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    # HEALTH CHECK
    def is_ready(self) -> bool:
        """Check if MCP initialization has run at least once."""
        return self._initialized
    
    def get_status(self) -> Dict[str, bool]:
        """Get connection status of all servers"""
        return {
            "initialized": self._initialized,
            "tea_database": "tea_database" in self.sessions,
            "tea_search": "tea_search" in self.sessions,
            "tea_visualization": "tea_visualization" in self.sessions,
            "tea_auction": "tea_auction" in self.sessions,
        }
    

# Global MCP client instance
mcp_client = MCPClientManager()


async def get_mcp_client() -> MCPClientManager:
    """Get the global MCP client instance"""
    if not mcp_client.is_ready():
        await mcp_client.initialize()
    return mcp_client

