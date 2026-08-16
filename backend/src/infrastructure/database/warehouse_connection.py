import os
import logging
from pathlib import Path
from typing import Any, Optional
from datetime import date, datetime
import duckdb

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_WAREHOUSE_DIR = BACKEND_DIR / "data_warehouse"
DEFAULT_WAREHOUSE_PATH = DEFAULT_WAREHOUSE_DIR / "warehouse.duckdb"
SCHEMA_SQL_PATH = DEFAULT_WAREHOUSE_DIR / "schema.sql"


class WarehouseConnection:
    """
    Singleton connection and lifecycle manager for DuckDB OLAP Warehouse.
    Provides fast, thread-safe access to dimensional tables and analytical data marts.
    """
    _instance: Optional["WarehouseConnection"] = None
    _db_path: Path
    _shared_conn: Optional[duckdb.DuckDBPyConnection] = None

    def __new__(cls, db_path: Optional[Path] = None):
        if cls._instance is None:
            cls._instance = super(WarehouseConnection, cls).__new__(cls)
            cls._instance._db_path = db_path or DEFAULT_WAREHOUSE_PATH
            cls._instance._init_warehouse()
            cls._instance._shared_conn = duckdb.connect(str(cls._instance._db_path), read_only=False)
        return cls._instance

    @property
    def db_path(self) -> Path:
        return self._db_path

    def get_connection(self) -> duckdb.DuckDBPyConnection:
        """Return a live cursor to the shared DuckDB database."""
        if self._shared_conn is None:
            self._shared_conn = duckdb.connect(str(self._db_path), read_only=False)
        return self._shared_conn.cursor()

    def _init_warehouse(self) -> None:
        """Initialize directory, execute schema DDL, and seed static dimensions if needed."""
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            conn = duckdb.connect(str(self._db_path))
            
            # Execute schema DDL
            if SCHEMA_SQL_PATH.exists():
                with open(SCHEMA_SQL_PATH, "r", encoding="utf-8") as f:
                    schema_sql = f.read()
                conn.execute(schema_sql)

            # Populate dim_date vectorized if empty
            date_count = conn.execute("SELECT COUNT(*) FROM dim_date").fetchone()[0]
            if date_count == 0:
                conn.execute("""
                    INSERT INTO dim_date
                    SELECT 
                        CAST(strftime(d, '%Y%m%d') AS INTEGER) AS date_key,
                        CAST(d AS DATE) AS full_date,
                        day(d) AS day_of_month,
                        dayofweek(d) AS day_of_week,
                        dayname(d) AS day_name,
                        month(d) AS month_num,
                        monthname(d) AS month_name,
                        strftime(d, '%b %y') AS month_year,
                        quarter(d) AS quarter,
                        year(d) AS year_num,
                        (dayofweek(d) IN (0, 6)) AS is_weekend,
                        CASE 
                            WHEN month(d) IN (1, 2, 3) THEN 'Western / Dimbula Quality Season'
                            WHEN month(d) IN (7, 8, 9) THEN 'Uva Quality Season'
                            WHEN month(d) IN (4, 5, 6) THEN 'South-West Monsoon Flush'
                            ELSE 'North-East Monsoon / Autumnal'
                        END AS tea_season
                    FROM generate_series(DATE '2024-01-01', DATE '2030-12-31', INTERVAL 1 DAY) as t(d)
                """)

            # Populate dim_tea_grade initial standard records if empty
            grade_count = conn.execute("SELECT COUNT(*) FROM dim_tea_grade").fetchone()[0]
            if grade_count == 0:
                conn.execute("""
                    INSERT INTO dim_tea_grade VALUES
                        (1, 'BOP', 'High Grown', 'Broken', 'LK-BOP'),
                        (2, 'BOPF', 'High Grown', 'Fannings', 'LK-BOPF'),
                        (3, 'OP', 'Low Grown', 'Whole Leaf', 'LK-OP'),
                        (4, 'OPA', 'Low Grown', 'Whole Leaf', 'LK-OPA'),
                        (5, 'PEKOE', 'Medium Grown', 'Whole Leaf', 'LK-PEK'),
                        (6, 'FBOP', 'Low Grown', 'Broken', 'LK-FBOP'),
                        (7, 'FBOPF1', 'Low Grown', 'Fannings', 'LK-FBOPF1'),
                        (8, 'DUST 1', 'Low Grown', 'Dust', 'LK-D1'),
                        (9, 'SILVER TIPS', 'High Grown', 'Whole Leaf', 'LK-ST'),
                        (10, 'GOLDEN TIPS', 'High Grown', 'Whole Leaf', 'LK-GT'),
                        (99, 'UNSPECIFIED', 'Unspecified', 'Whole Leaf', 'LK-GEN')
                """)

            conn.close()
        except Exception as e:
            logger.error(f"Failed to initialize DuckDB warehouse: {e}", exc_info=True)


def get_warehouse() -> WarehouseConnection:
    """Dependency helper to get singleton WarehouseConnection."""
    return WarehouseConnection()
