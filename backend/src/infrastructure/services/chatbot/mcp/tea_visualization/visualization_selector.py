import math
import re
from datetime import datetime


class VisualizationSelector:
    """Smart visualization type detection based on data structure."""

    SCALE_THRESHOLD = 100

    @staticmethod
    def detect_column_types(columns, rows):
        """
        Detect whether columns are numeric or categorical.
        
        Args:
            columns: List of column names
            rows: List of row dictionaries
            
        Returns:
            Dict mapping column names to 'numeric' or 'categorical'
        """
        column_types = {}

        if not rows:
            return {col: "categorical" for col in columns}

        for col in columns:
            value = VisualizationSelector._first_non_null(rows, col)
            if VisualizationSelector._is_numeric(value):
                column_types[col] = "numeric"
            else:
                column_types[col] = "categorical"

        return column_types

    @staticmethod
    def _is_numeric(value) -> bool:
        """Check if a value is numeric."""
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def _is_date_column_name(col_name: str) -> bool:
        """Check if column name indicates it's a date/time column."""
        date_keywords = ["date", "time", "month", "year", "day", "week", "created", "updated"]
        return any(kw in col_name.lower() for kw in date_keywords)

    @staticmethod
    def _is_date_value(value) -> bool:
        """Check if a value looks like a date/time string."""
        if not isinstance(value, str):
            return False

        value = value.strip()
        if not value:
            return False

        # Common date formats
        if re.match(r"^\d{4}[-/]\d{2}[-/]\d{2}", value):
            return True

        # ISO 8601 attempt
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
            return True
        except ValueError:
            return False

    @staticmethod
    def _first_non_null(rows, col):
        for row in rows:
            if col in row:
                value = row.get(col)
                if value is not None and value != "":
                    return value
        return None

    @staticmethod
    def _max_abs_by_column(rows, col):
        max_abs = 0.0
        for row in rows:
            value = row.get(col)
            if VisualizationSelector._is_numeric(value):
                max_abs = max(max_abs, abs(float(value)))
        return max_abs

    @staticmethod
    def _group_by_magnitude(max_abs_by_col):
        """Group columns by order of magnitude (within 1-2 orders)."""
        order_pairs = []
        for col, max_abs in max_abs_by_col.items():
            if max_abs > 0:
                order = int(math.floor(math.log10(max_abs)))
            else:
                order = 0
            order_pairs.append((col, order))

        order_pairs.sort(key=lambda x: x[1])

        groups = []
        current_group = []
        current_order = None

        for col, order in order_pairs:
            if current_order is None:
                current_group = [col]
                current_order = order
                continue

            if abs(order - current_order) <= 2:
                current_group.append(col)
            else:
                groups.append(current_group)
                current_group = [col]
                current_order = order

        if current_group:
            groups.append(current_group)

        return groups

    @staticmethod
    def suggest(columns, rows):
        """
        Suggest best visualization type based on data structure.
        
        Rules:
        - 1 categorical + 1 numeric → bar
        - 1 categorical + 2+ numeric → grouped bar
        - Date + numeric(s) → line
        - 1 row + 2+ numeric → pie
        - Otherwise → table
        
        Returns:
            Dict with 'type', 'x_axis', 'numeric_cols', 'candidates'
        """
        if not columns or not rows:
            return {"type": "table", "candidates": ["table"]}

        # Detect column types
        column_types = VisualizationSelector.detect_column_types(columns, rows)
        date_cols = []
        for col in columns:
            if VisualizationSelector._is_date_column_name(col):
                date_cols.append(col)
                continue
            sample_value = VisualizationSelector._first_non_null(rows, col)
            if VisualizationSelector._is_date_value(sample_value):
                date_cols.append(col)

        numeric_cols = [
            c for c in columns
            if column_types.get(c) == "numeric" and c not in date_cols
        ]
        categorical_cols = [
            c for c in columns
            if column_types.get(c) == "categorical" and c not in date_cols
        ]
        
        # Rule 1: Single row + multiple numeric columns → pie
        if len(rows) == 1 and len(numeric_cols) >= 2:
            return {
                "type": "pie",
                "numeric_cols": numeric_cols,
                "candidates": ["pie", "table"]
            }
        
        # Rule 2: Has date column + numeric
        if date_cols and numeric_cols:
            date_col = date_cols[0]
            return {
                "type": "line",
                "x_axis": date_col,
                "numeric_cols": numeric_cols,
                "candidates": ["line", "bar", "table"]
            }
        
        # Rule 3: 1 categorical + 1 numeric → single bar
        if len(categorical_cols) == 1 and len(numeric_cols) == 1:
            return {
                "type": "bar",
                "x_axis": categorical_cols[0],
                "numeric_cols": numeric_cols,
                "candidates": ["bar", "pie", "table"]
            }
        
        # Rule 4: 1 categorical + 2+ numeric → grouped bar or multi-axis bar
        if len(categorical_cols) == 1 and len(numeric_cols) >= 2:
            max_abs_by_col = {
                col: VisualizationSelector._max_abs_by_column(rows, col)
                for col in numeric_cols
            }
            non_zero_max = [v for v in max_abs_by_col.values() if v > 0]
            if non_zero_max:
                global_max = max(non_zero_max)
                global_min = min(non_zero_max)
            else:
                global_max = 0
                global_min = 0

            use_multi_axis = False
            axis_groups = []
            if global_min > 0 and global_max / global_min > VisualizationSelector.SCALE_THRESHOLD:
                use_multi_axis = True
                axis_groups = VisualizationSelector._group_by_magnitude(max_abs_by_col)

            return {
                "type": "bar",
                "x_axis": categorical_cols[0],
                "numeric_cols": numeric_cols,
                "is_grouped": not use_multi_axis,
                "is_multi_axis": use_multi_axis,
                "axis_groups": axis_groups,
                "scale_threshold": VisualizationSelector.SCALE_THRESHOLD,
                "candidates": ["bar", "table"]
            }
        
        # Default: table
        return {
            "type": "table",
            "candidates": ["table"]
        }
