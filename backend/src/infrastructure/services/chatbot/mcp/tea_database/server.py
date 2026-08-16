"""
Tea Database MCP Server

Handles both:
1. Natural Language → SQL (via Gemini)  
2. Raw SQL queries (direct execution)
"""

import anyio
import json
import logging
import re
from decimal import Decimal
from typing import Dict, Any, List

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from anyio import get_cancelled_exc_class

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.config import get_settings, get_mssql_connection_string
from src.infrastructure.services.chatbot.mcp.tea_database.sql_generator import SQLGenerator
from src.infrastructure.services.chatbot.mcp.tea_database import schema_extractor
from src.infrastructure.services.chatbot.mcp.tea_visualization.visualization_selector import VisualizationSelector


settings = get_settings()

logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger("tea_database_server")

# DATABASE SETUP
DATABASE_URL = get_mssql_connection_string()

engine = create_engine(
    DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    echo=False
)

# Initialize AI components
sql_generator = SQLGenerator(api_key=settings.GOOGLE_API_KEY)

_schema_initialized = False
_schema_init_error = None


def _ensure_schema_initialized() -> bool:
    """Initialize schema extractor lazily; keep server alive on transient DB errors."""
    global _schema_initialized, _schema_init_error

    if _schema_initialized:
        return True

    try:
        schema_extractor.initialize(engine)
        _schema_initialized = True
        _schema_init_error = None
        logger.info("Schema extractor initialized")
        return True
    except Exception as e:
        _schema_init_error = str(e)
        logger.warning("Schema extractor initialization failed: %s", e)
        return False


# Schema cache - extracted once at startup
_schema_cache: str = None


def get_schema() -> str:
    """Get DB schema, cached after first extraction"""
    global _schema_cache
    if not _ensure_schema_initialized():
        raise RuntimeError(
            "Database schema is currently unavailable. "
            f"Last initialization error: {_schema_init_error}"
        )

    if _schema_cache is None:
        logger.info("Extracting database schema...")
        _schema_cache = schema_extractor.extract_schema()
        logger.info(f"Schema cached ({len(_schema_cache)} chars)")
    return _schema_cache


# SQL HELPERS
def is_natural_language(query: str) -> bool:
    """
    Detect if input is natural language (not raw SQL).
    Raw SQL starts with SELECT or WITH (CTE) keywords.
    """
    stripped = query.strip().upper()
    return not (stripped.startswith("SELECT") or stripped.startswith("WITH"))


def validate_sql(sql: str) -> None:
    """Safety validation - only SELECT queries allowed"""
    forbidden = [
        "INSERT", "UPDATE", "DELETE", "DROP",
        "ALTER", "TRUNCATE", "CREATE", "EXEC", "MERGE"
    ]
    upper = sql.upper()

    starts_valid = upper.strip().startswith("SELECT") or upper.strip().startswith("WITH")
    if not starts_valid:
        raise ValueError("Only SELECT queries are allowed (including CTEs that start with WITH).")

    # Match forbidden operations as full SQL keywords, not substrings.
    # Example: "created_at" must NOT trigger forbidden "CREATE".
    for kw in forbidden:
        if re.search(rf"\b{re.escape(kw)}\b", upper):
            raise ValueError(f"Forbidden keyword detected: {kw}")

    if ";" in sql.strip()[:-1]:
        raise ValueError("Multiple statements not allowed.")


def clean_sql(raw: str) -> str:
    """
    Strip markdown/extra text from LLM SQL response.
    
    Handles:
    - ```sql ... ``` blocks
    - ``` ... ``` blocks
    - Plain text before WITH/SELECT (preserves CTEs)
    """
    cleaned = raw.strip()

    # Remove markdown code blocks
    if "```sql" in cleaned:
        cleaned = cleaned.split("```sql", 1)[1].split("```", 1)[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()

    # Extract from first WITH or SELECT keyword while preserving CTE queries
    start_match = re.search(r"\b(WITH|SELECT)\b", cleaned, re.IGNORECASE)
    if start_match:
        cleaned = cleaned[start_match.start():].strip()

    # Remove trailing semicolon
    cleaned = cleaned.rstrip(";").strip()

    return cleaned


def fix_mssql_syntax(sql: str) -> str:
    """
    Fix common MSSQL syntax errors in LLM-generated SQL.
    
    Issues fixed:
    - SELECT TOP X DISTINCT → SELECT DISTINCT TOP X (correct order)
    - SELECT DISTINC → SELECT DISTINCT (typo)
    - Multiple spaces → single space
    - Line breaks in column list → proper formatting
    """
    # Fix DISTINCT TOP order: "TOP X DISTINCT" → "DISTINCT TOP X"
    sql = re.sub(
        r'\bTOP\s+(\d+)\s+DISTINCT\b',
        r'DISTINCT TOP \1',
        sql,
        flags=re.IGNORECASE
    )
    
    # Fix common typo: DISTINC → DISTINCT
    sql = re.sub(r'\bDISTINC\b', 'DISTINCT', sql, flags=re.IGNORECASE)
    
    # Clean up multiple spaces
    sql = re.sub(r'\s+', ' ', sql)
    
    # Clean up spaces around common operators
    sql = re.sub(r'\s*=\s*', ' = ', sql)
    sql = re.sub(r'\s*,\s*', ', ', sql)
    
    return sql.strip()


def normalize_row(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Decimal and other non-JSON types"""
    normalized = {}
    for key, value in row_dict.items():
        if isinstance(value, Decimal):
            normalized[key] = float(value)
        elif isinstance(value, str):
            try:
                normalized[key] = float(value)
            except Exception:
                normalized[key] = value
        else:
            normalized[key] = value
    return normalized


# SQL EXECUTION
def execute_sql(sql: str) -> Dict[str, Any]:
    """
    Execute validated SQL and return structured result.
    
    Returns:
        Dict with status, columns, raw_data, sql_query, suggested_visualization
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text(sql))
            rows = [normalize_row(dict(row._mapping)) for row in result]
            columns = list(result.keys())

            if not rows:
                return {
                    "status": "success",
                    "summary": "Query executed but returned no data.",
                    "columns": columns,
                    "raw_data": [],
                    "sql_query": sql,
                    "suggested_visualization": {
                        "type": "table",
                        "candidates": ["table"]
                    }
                }

            viz_config = VisualizationSelector.suggest(columns, rows)

            return {
                "status": "success",
                "summary": f"Returned {len(rows)} records.",
                "columns": columns,
                "raw_data": rows,
                "sql_query": sql,
                "suggested_visualization": viz_config
            }

    except SQLAlchemyError as e:
        logger.exception("Database error during execution")
        return {
            "status": "error",
            "message": "Database execution failed",
            "details": str(e),
            "sql_query": sql
        }
    except Exception as e:
        logger.exception("Unexpected execution error")
        return {
            "status": "error",
            "message": "Unexpected error during query",
            "details": str(e)
        }


# MAIN QUERY PROCESSOR
async def process_query(user_input: str) -> Dict[str, Any]:
    """
    Route query to SQL execution or NL→SQL pipeline.
    
    Path A (Raw SQL):
        validate → execute → return results
    
    Path B (Natural Language):
        get schema → Gemini generates SQL → clean → validate → execute → return results
    """

    # Raw SQL
    if not is_natural_language(user_input):
        logger.info(f"[SQL] Direct execution: {user_input[:80]}")

        try:
            validate_sql(user_input)
        except ValueError as e:
            logger.warning(f"[SQL] Validation failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "input_type": "sql"
            }

        result = execute_sql(user_input)
        result["input_type"] = "sql"
        return result

    # Natural Language → SQL
    logger.info(f"[NL] Processing: {user_input}")

    try:
        # Step 1: Get schema
        schema = get_schema()

        # Step 2: Generate SQL via Gemini
        logger.info("[NL] Generating SQL with Gemini...")
        raw_sql = await sql_generator.generate_sql(
            question=user_input,
            schema=schema
        )
        logger.info(f"[NL] Gemini response: {raw_sql[:200]}")

        # Step 3: Clean SQL
        generated_sql = clean_sql(raw_sql)
        logger.info(f"[NL] Cleaned SQL: {generated_sql}")

        if not generated_sql:
            logger.error("[NL] Generated SQL is empty")
            return {
                "status": "error",
                "message": "AI generated an empty query",
                "generated_sql": generated_sql,
                "input_type": "natural_language"
            }

        generated_upper = generated_sql.upper().strip()
        if not (generated_upper.startswith("SELECT") or generated_upper.startswith("WITH")):
            logger.error("[NL] Generated SQL invalid: Only SELECT queries (including CTEs) are allowed.")
            return {
                "status": "error",
                "message": "AI generated an invalid query: Only SELECT queries are allowed.",
                "generated_sql": generated_sql,
                "input_type": "natural_language"
            }
        
        # Step 3.5: Fix common MSSQL syntax issues
        generated_sql = fix_mssql_syntax(generated_sql)
        logger.info(f"[NL] Fixed SQL: {generated_sql}")

        # Step 4: Validate
        try:
            validate_sql(generated_sql)
        except ValueError as e:
            logger.error(f"[NL] Generated SQL invalid: {e}")
            return {
                "status": "error",
                "message": f"AI generated an invalid query: {str(e)}",
                "generated_sql": generated_sql,
                "input_type": "natural_language"
            }

        # Step 5: Execute
        logger.info("[NL] Executing generated SQL...")
        result = execute_sql(generated_sql)
        result["input_type"] = "natural_language"
        result["original_question"] = user_input

        return result

    except Exception as e:
        logger.error(f"[NL] Pipeline error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to process natural language query",
            "details": str(e),
            "input_type": "natural_language"
        }


# MCP SERVER
server = Server("tea_database")

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="query_tea_data",
            description=(
                "Query the TeablendAI tea analytics database.\n"
                "Accepts EITHER:\n"
                "1. Natural language: 'Show me top customers by region'\n"
                "2. Raw SQL: 'SELECT TOP 5 * FROM Customer'\n"
                "Auto-detects input type."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "Natural language question OR SQL SELECT query."
                        )
                    }
                },
                "required": ["query"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    if name != "query_tea_data":
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "error",
                "message": f"Unknown tool: {name}"
            })
        )]

    user_query = (arguments or {}).get("query", "").strip()

    if not user_query:
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "error",
                "message": "Missing 'query' argument."
            })
        )]

    # Process (auto-routes NL or SQL)
    result = await process_query(user_query)

    return [TextContent(
        type="text",
        text=json.dumps(result, default=str)
    )]


async def main():
    logger.info("tea_database MCP server started (stdio).")

    # Pre-warm schema cache
    try:
        get_schema()
        logger.info("Schema pre-loaded")
    except Exception as e:
        logger.warning(f"Schema pre-load failed (will retry on demand): {e}")

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
