"""
Tea Search MCP Server

Web search fallback using Tavily API + Gemini for answer generation.
Used when database has no relevant data.
"""

import anyio
import json
import logging
from typing import Dict, Any, List
from anyio import get_cancelled_exc_class

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.config import get_settings

settings = get_settings()

logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger("tea_search_server")


# SEARCH SETUP
def get_tavily_client():
    """Get Tavily client - lazy initialization"""
    try:
        from tavily import TavilyClient
        api_key = getattr(settings, "TAVILY_API_KEY", None)
        if not api_key:
            raise ValueError("TAVILY_API_KEY not configured")
        return TavilyClient(api_key=api_key)
    except ImportError:
        raise ImportError("tavily-python not installed. Run: pip install tavily-python")


def get_gemini_llm():
    """Get Gemini LLM for answer generation"""
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model=getattr(settings, "MODEL_NAME", "gemini-2.0-flash"),
        google_api_key=getattr(settings, "GOOGLE_API_KEY", None),
        temperature=0
    )


# SEARCH LOGIC
async def search_tea_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search web for tea-related information using Tavily.
    
    Flow:
        1. Search web via Tavily API
        2. Extract relevant results
        3. Generate answer using Gemini
    
    Args:
        query: Search query (tea-related)
        max_results: Maximum results to return
    
    Returns:
        Dict with answer, results, sources
    """
    # Truncate long queries (Tavily limit)
    MAX_QUERY_LENGTH = 200
    if len(query) > MAX_QUERY_LENGTH:
        logger.warning(f"[SEARCH] Query too long ({len(query)} chars), truncating")
        query = query[:MAX_QUERY_LENGTH].rsplit(' ', 1)[0]

    try:
        # Step 1: Search with Tavily
        logger.info(f"[SEARCH] Searching: {query}")
        client = get_tavily_client()
        
        # Add tea context to query for better results
        tea_query = f"Sri Lanka Ceylon tea industry {query}"
        
        response = client.search(
            query=tea_query,
            search_depth="advanced",
            max_results=max_results,
            include_answer=True
        )
        
        logger.info(f"[SEARCH] Got {len(response.get('results', []))} results")
        
        # Step 2: Extract results
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:500]  # Truncate long content
            })
        
        # Step 3: Generate answer with Gemini
        if results:
            answer = await generate_answer(query, results)
        else:
            answer = "No relevant information found for this tea-related query."
        
        return {
            "status": "success",
            "answer": answer,
            "results": results,
            "result_count": len(results),
            "query": query
        }
    
    except ValueError as e:
        # API key missing
        logger.error(f"[SEARCH] Configuration error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "results": []
        }
    
    except Exception as e:
        logger.error(f"[SEARCH] Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Search failed: {str(e)}",
            "results": []
        }


async def generate_answer(question: str, results: List[Dict]) -> str:
    """
    Generate natural language answer from search results using Gemini.
    
    Args:
        question: Original user question
        results: Tavily search results
    
    Returns:
        str: Natural language answer
    """
    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = get_gemini_llm()
        
        # Build context from search results
        context = "\n\n".join([
            f"Source: {r['title']}\n{r['content']}"
            for r in results[:3]  # Use top 3 results
        ])
        
        system = SystemMessage(content=(
            "You are TeaBlendAI, an expert assistant for Sri Lankan tea industry.\n"
            "Answer the question based ONLY on the provided search results.\n"
            "Be concise and factual. If results don't answer the question, say so.\n"
            "Do not make up information."
        ))
        
        human = HumanMessage(content=(
            f"Question: {question}\n\n"
            f"Search Results:\n{context}\n\n"
            f"Provide a concise answer based on these results."
        ))
        
        response = await llm.ainvoke([system, human])
        return response.content.strip()
    
    except Exception as e:
        logger.error(f"[SEARCH] Answer generation failed: {e}")
        # Fallback: return snippet from first result
        if results:
            return results[0].get("content", "")[:300]
        return "Could not generate answer from search results."


# MCP SERVER
server = Server("tea_search")


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available search tools"""
    return [
        Tool(
            name="search_web",
            description=(
                "Search the web for tea industry information.\n"
                "Used as fallback when database has no relevant data.\n"
                "Searches for Ceylon tea, Sri Lankan tea industry, "
                "tea prices, market trends, etc."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Tea-related search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum results to return (default: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool execution"""
    
    if name != "search_web":
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "error",
                "message": f"Unknown tool: {name}"
            })
        )]
    
    query = (arguments or {}).get("query", "").strip()
    max_results = int((arguments or {}).get("max_results", 5))
    
    if not query:
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "error",
                "message": "Missing 'query' argument."
            })
        )]
    
    result = await search_tea_web(query, max_results)
    
    return [TextContent(
        type="text",
        text=json.dumps(result, default=str)
    )]



async def main():
    """Run the MCP search server"""
    logger.info("tea_search MCP server started (stdio).")
    
    # Validate config at startup
    tavily_key = getattr(settings, "TAVILY_API_KEY", None)
    google_key = getattr(settings, "GOOGLE_API_KEY", None)
    
    if not tavily_key:
        logger.warning("TAVILY_API_KEY not set - search will fail")
    else:
        logger.info("Tavily API key configured")
    
    if not google_key:
        logger.warning("GOOGLE_API_KEY not set - answer generation will fail")
    else:
        logger.info("Google API key configured")
    
    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                initialization_options=server.create_initialization_options()
            )
    except get_cancelled_exc_class():
        pass


if __name__ == "__main__":
    anyio.run(main)