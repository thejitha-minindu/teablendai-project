"""
Tea Visualization MCP Server

Proper MCP server for Chart.js visualization generation.
"""

import anyio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from anyio import get_cancelled_exc_class

from src.infrastructure.services.chatbot.mcp.tea_visualization.visualization_selector import (
    VisualizationSelector
)
from src.config import get_settings

settings = get_settings()

logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger("tea_visualization_server")



# CHART GENERATION LOGIC
def detect_chart_type(keys: List[str], data: List[Dict[str, Any]]) -> str:
    """
    Detect best chart type from data structure.
    
    Rules:
    - Has date/time column → line
    - Single row, multiple columns → pie  
    - Multiple rows, 2 columns → bar
    - Otherwise → bar (default)
    """
    if not data or not keys:
        return "bar"

    # Check for date/time columns
    date_keywords = ["date", "time", "month", "year", "day", "week"]
    if any(kw in k.lower() for k in keys for kw in date_keywords):
        return "line"

    # Single row with multiple columns → pie
    if len(data) == 1 and len(keys) > 1:
        return "pie"

    return "bar"


def build_chart_config(
    chart_type: str,
    keys: List[str],
    data: List[Dict[str, Any]],
    query: str = "",
    x_axis: str = None,
    numeric_cols: List[str] = None,
    axis_groups: List[List[str]] = None
) -> Dict[str, Any]:
    """
    Build Chart.js configuration from data.
    
    Supports:
    - Single dataset bar/line charts
    - Grouped bar charts (multiple numeric columns)
    - Pie charts (single row or multi-row)
    - Table rendering
    
    Args:
        chart_type: 'bar', 'line', or 'pie'
        keys: Column names
        data: List of row dictionaries
        query: Original query for chart title
        x_axis: Column name for x-axis (categorical)
        numeric_cols: List of numeric column names to visualize
    
    Returns:
        Chart.js configuration dict
    """
    labels = []
    datasets = []
    scales = {}

    if chart_type in ["bar", "line"]:
        # Determine which columns to use
        if not x_axis:
            # Find first categorical column
            x_axis = keys[0]
        
        if not numeric_cols:
            # Find numeric columns (all except x_axis)
            numeric_cols = [k for k in keys if k != x_axis and _is_numeric(data[0].get(k))]
            if not numeric_cols and len(keys) > 1:
                numeric_cols = [keys[1]]
        
        # Extract labels from x_axis
        labels = [str(row.get(x_axis, "")) for row in data]
        
        # Create dataset for each numeric column (supports grouped bars and multi-axis)
        axis_map = {}
        if axis_groups:
            for idx, group in enumerate(axis_groups):
                axis_id = f"y{idx}"
                for col in group:
                    axis_map[col] = axis_id

            for idx, group in enumerate(axis_groups):
                axis_id = f"y{idx}"
                scales[axis_id] = {
                    "type": "linear",
                    "position": "left" if idx == 0 else "right",
                    "beginAtZero": True,
                    "grid": {"drawOnChartArea": idx == 0}
                }
        else:
            scales["y"] = {"beginAtZero": True}

        scales["x"] = {"type": "category"}

        colors = _get_colors(len(numeric_cols))
        for idx, num_col in enumerate(numeric_cols):
            datasets.append({
                "label": num_col,
                "data": [
                    float(row.get(num_col, 0))
                    if _is_numeric(row.get(num_col))
                    else 0
                    for row in data
                ],
                "backgroundColor": colors[idx],
                "borderColor": colors[idx].replace("0.6", "1"),  # Darker border
                "borderWidth": 1 if chart_type == "bar" else 2,
                "fill": chart_type == "line",
                "tension": 0.3 if chart_type == "line" else None,
                "yAxisID": axis_map.get(num_col, "y")
            })
    
    elif chart_type == "pie":
        if len(data) == 1:
            # Single row: each numeric column is a slice
            numeric_keys = [k for k in keys if _is_numeric(data[0].get(k))]
            labels = numeric_keys
            datasets = [{
                "label": "Values",
                "data": [float(data[0].get(k, 0)) for k in numeric_keys],
                "backgroundColor": _get_colors(len(numeric_keys)),
                "borderColor": [c.replace("0.6", "1") for c in _get_colors(len(numeric_keys))],
                "borderWidth": 2
            }]
        else:
            # Multiple rows: first categorical = labels, numeric cols = slices per row
            if not x_axis:
                x_axis = next((k for k in keys if not _is_numeric(data[0].get(k))), keys[0])
            
            labels = [str(row.get(x_axis, "")) for row in data]
            
            if not numeric_cols:
                numeric_cols = [k for k in keys if k != x_axis and _is_numeric(data[0].get(k))]
                if not numeric_cols and len(keys) > 1:
                    numeric_cols = [keys[1]]
            
            # Use first numeric column for pie
            if numeric_cols:
                num_col = numeric_cols[0]
                datasets = [{
                    "label": num_col,
                    "data": [
                        float(row.get(num_col, 0))
                        if _is_numeric(row.get(num_col))
                        else 0
                        for row in data
                    ],
                    "backgroundColor": _get_colors(len(data)),
                    "borderColor": [c.replace("0.6", "1") for c in _get_colors(len(data))],
                    "borderWidth": 2
                }]

    return {
        "type": chart_type,
        "data": {
            "labels": labels,
            "datasets": datasets
        },
        "options": {
            "responsive": True,
            "plugins": {
                "legend": {"position": "top"},
                "title": {
                    "display": True,
                    "text": _build_chart_title(
                        chart_type=chart_type,
                        x_axis=x_axis,
                        numeric_cols=numeric_cols,
                        keys=keys,
                    ),
                    "font": {"size": 14, "weight": "bold"}
                }
            },
            "scales": scales if chart_type in ["bar", "line"] else {}
        }
    }


def _humanize_label(label: str) -> str:
    """Convert snake_case / camelCase-ish labels to readable title case."""
    cleaned = (label or "").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in cleaned.split()) if cleaned else "Value"


def _build_chart_title(
    chart_type: str,
    x_axis: str | None,
    numeric_cols: List[str] | None,
    keys: List[str],
) -> str:
    """Generate a concise, descriptive chart title from chart metadata."""
    metrics = numeric_cols or []
    dimension = x_axis or (keys[0] if keys else None)

    if chart_type in ["bar", "line"]:
        if dimension and len(metrics) == 1:
            return f"{_humanize_label(metrics[0])} by {_humanize_label(dimension)}"
        if dimension and len(metrics) > 1:
            return f"Metrics by {_humanize_label(dimension)}"
        return "Tea Analytics Overview"

    if chart_type == "pie":
        if metrics:
            return f"{_humanize_label(metrics[0])} Distribution"
        if dimension:
            return f"Distribution by {_humanize_label(dimension)}"
        return "Tea Distribution"

    return "Tea Analytics Overview"


def _is_numeric(value) -> bool:
    """Check if value is numeric"""
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def _get_colors(count: int) -> List[str]:
    """Get chart colors (15 distinct colors)"""
    colors = [
        "rgba(255, 99, 132, 0.6)",   # red
        "rgba(54, 162, 235, 0.6)",   # blue
        "rgba(255, 206, 86, 0.6)",   # yellow
        "rgba(75, 192, 192, 0.6)",   # teal
        "rgba(153, 102, 255, 0.6)",  # purple
        "rgba(255, 159, 64, 0.6)",   # orange
        "rgba(199, 199, 199, 0.6)",  # gray
        "rgba(83, 102, 255, 0.6)",   # indigo
        "rgba(255, 102, 255, 0.6)",  # pink
        "rgba(102, 255, 102, 0.6)",  # green
        "rgba(255, 204, 153, 0.6)",  # peach
        "rgba(102, 204, 255, 0.6)",  # sky blue
        "rgba(204, 102, 255, 0.6)",  # violet
        "rgba(255, 255, 102, 0.6)",  # light yellow
        "rgba(102, 255, 204, 0.6)",  # aqua
    ]
    # Repeat colors if more data points than colors
    return [colors[i % len(colors)] for i in range(count)]



def create_visualization(
    data: List[Dict[str, Any]],
    query: str = "",
    chart_type_override: str = None
) -> Dict[str, Any]:
    """
    Main visualization creation function.
    
    Args:
        data: List of row dictionaries from database
        query: Original user query (for chart title)
        chart_type_override: Force specific chart type
    
    Returns:
        Visualization result dict
    """
    start_time = datetime.now(timezone.utc)

    if not data:
        logger.warning("No data received for visualization")
        return {
            "success": False,
            "error": "No data to visualize",
            "visualization_type": None,
            "visualization": None
        }

    keys = list(data[0].keys())

    # Determine chart type with metadata
    viz_metadata = VisualizationSelector.suggest(keys, data)
    if chart_type_override and chart_type_override in ["bar", "line", "pie", "table"]:
        chart_type = chart_type_override
    else:
        chart_type = viz_metadata.get("type", "bar")

    logger.info(f"Creating {chart_type} chart for {len(data)} rows")
    logger.debug(f"Visualization metadata: {viz_metadata}")

    # Handle table type - return raw data
    if chart_type == "table":
        response_time = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        return {
            "success": True,
            "visualization_type": "table",
            "visualization": {
                "type": "table",
                "columns": keys,
                "data": data
            },
            "row_count": len(data),
            "response_time_ms": response_time
        }

    # Build chart config with metadata
    chart_config = build_chart_config(
        chart_type, 
        keys, 
        data, 
        query,
        x_axis=viz_metadata.get("x_axis"),
        numeric_cols=viz_metadata.get("numeric_cols"),
        axis_groups=viz_metadata.get("axis_groups")
    )

    response_time = int(
        (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
    )

    return {
        "success": True,
        "visualization_type": chart_type,
        "visualization": chart_config,
        "row_count": len(data),
        "response_time_ms": response_time
    }


# MCP SERVER SETUP
server = Server("tea_visualization")


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available visualization tools"""
    return [
        Tool(
            name="create_visualization",
            description=(
                "Generate Chart.js visualization from structured data. "
                "Auto-detects best chart type (bar, line, pie, table) "
                "based on data structure."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "description": "List of row dictionaries from database query",
                        "items": {"type": "object"}
                    },
                    "query": {
                        "type": "string",
                        "description": "Original user query (used as chart title)",
                        "default": ""
                    },
                    "chart_type": {
                        "type": "string",
                        "description": "Force specific chart type (optional)",
                        "enum": ["bar", "line", "pie", "table"],
                        "default": None
                    }
                },
                "required": ["data"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls"""

    if name != "create_visualization":
        return [TextContent(
            type="text",
            text=json.dumps({
            "success": False,
            "error": f"Unknown tool: {name}"
        }))]

    # Extract arguments
    data = arguments.get("data", [])
    query = arguments.get("query", "")
    chart_type = arguments.get("chart_type", None)

    # Validate data
    if not data:
        return [TextContent(
            type="text",
            text=json.dumps({
            "success": False,
            "error": "No data provided",
            "visualization_type": None,
            "visualization": None
        }))]

    # Create visualization
    result = create_visualization(
        data=data,
        query=query,
        chart_type_override=chart_type
    )

    return [TextContent(
        type="text",
        text=json.dumps(result, default=str)
        )]



async def main():
    """Run the MCP visualization server"""
    logger.info("tea_visualization MCP server started (stdio).")
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
