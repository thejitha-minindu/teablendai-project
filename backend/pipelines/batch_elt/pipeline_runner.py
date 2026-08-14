import argparse
import logging
import time
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List

from src.infrastructure.database.warehouse_connection import get_warehouse
from src.infrastructure.database.connection import SessionLocal
from pipelines.batch_elt.extractor import MSSQLExtractor
from pipelines.batch_elt.transformer import StarSchemaTransformer
from pipelines.batch_elt.data_quality import DataQualityValidator
from pipelines.batch_elt.loader import DuckDBWarehouseLoader

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("BatchELTPipeline")


def generate_sample_tea_data() -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate realistic Ceylon tea auction dataset for development / simulation
    when MSSQL has minimal historical data.
    """
    base_users = [
        {"user_id": str(uuid.uuid4()), "first_name": "Dilmah", "last_name": "Estates", "user_role": "seller", "created_at": datetime(2025, 1, 1)},
        {"user_id": str(uuid.uuid4()), "first_name": "Finlays", "last_name": "Colombo", "user_role": "buyer", "created_at": datetime(2025, 1, 1)},
        {"user_id": str(uuid.uuid4()), "first_name": "Mackwoods", "last_name": "Tea", "user_role": "seller", "created_at": datetime(2025, 1, 1)},
        {"user_id": str(uuid.uuid4()), "first_name": "Akbar", "last_name": "Brothers", "user_role": "buyer", "created_at": datetime(2025, 1, 1)},
        {"user_id": str(uuid.uuid4()), "first_name": "Bogawantalawa", "last_name": "Estates", "user_role": "seller", "created_at": datetime(2025, 1, 1)},
    ]

    grades = ["BOP", "BOPF", "OP", "PEKOE", "FBOP", "DUST 1"]
    auctions = []
    bids = []
    
    start_dt = datetime(2025, 1, 1)
    for i in range(120):
        auc_id = str(uuid.uuid4())
        auc_time = start_dt + timedelta(days=i * 4, hours=10)
        grade = grades[i % len(grades)]
        base_price = 950.0 + (i % 8) * 60.0
        sold = (i % 6 != 0)  # 83% sold rate
        sold_price = (base_price * (1.15 + (i % 15) * 0.02)) if sold else 0.0
        buyer_id = base_users[1]["user_id"] if (i % 2 == 0) else base_users[3]["user_id"]

        auctions.append({
            "auction_id": auc_id,
            "custom_auction_id": f"AUC-2025-{1000 + i}",
            "auction_name": f"{grade} Premium Ceylon Lot #{i + 1}",
            "seller_id": base_users[0]["user_id"] if i % 2 == 0 else base_users[2]["user_id"],
            "grade": grade,
            "company_name": "Lanka Tea Auctioneers",
            "estate_name": "Nuwara Eliya High Elevation Estate",
            "quantity": 2500.0 + (i % 10) * 500.0,
            "origin": "Sri Lanka",
            "base_price": base_price,
            "start_time": auc_time,
            "duration": 45.0,
            "status": "History" if sold else "Scheduled",
            "buyer": buyer_id if sold else None,
            "sold_price": sold_price,
            "created_at": auc_time - timedelta(days=2),
        })

        if sold:
            bids.append({
                "bid_id": str(uuid.uuid4()),
                "auction_id": auc_id,
                "buyer_id": buyer_id,
                "bid_amount": sold_price,
                "bid_time": auc_time + timedelta(minutes=25)
            })

    tea_purchases = [
        {"id": f"P-{i}", "source_type": "Estate Direct", "standard": grades[i % len(grades)], "price_per_kg": 1100.0 + i * 20, "quantity_kg": 5000.0 + i * 200, "purchase_date": date(2025, 1 + (i % 12), 15)}
        for i in range(24)
    ]

    tea_blend_sales = [
        {"id": f"S-{i}", "customer_id": 101 + (i % 5), "blend_name": f"English Breakfast Blend #{1 + i % 3}", "price_per_kg": 1850.0 + i * 30, "quantity_kg": 1200.0 + i * 150, "sale_date": date(2025, 1 + (i % 12), 20)}
        for i in range(36)
    ]

    return {
        "users": base_users,
        "auctions": auctions,
        "bids": bids,
        "tea_purchases": tea_purchases,
        "tea_blend_sales": tea_blend_sales
    }


def run_batch_elt_pipeline(full_refresh: bool = False, populate_samples_if_empty: bool = True) -> Dict[str, Any]:
    """
    Execute the end-to-end Batch ELT Pipeline:
    Extract (MSSQL) -> Transform (Kimball Star Schema) -> Quality Validate -> Load (DuckDB) -> Refresh Marts.
    """
    start_time = time.time()
    run_id = str(uuid.uuid4())[:8]
    execution_mode = "FULL_REFRESH" if full_refresh else "INCREMENTAL"
    
    logger.info(f"=== Starting Batch ELT Pipeline Run [{run_id}] ({execution_mode}) ===")
    
    # Initialize Warehouse Connection
    wh = get_warehouse()
    conn = wh.get_connection()
    
    total_extracted = 0
    total_loaded = 0
    checks_passed = 0
    checks_failed = 0
    error_msg = None

    try:
        # Extract from MSSQL
        db_session = None
        raw_data = {"users": [], "auctions": [], "bids": [], "tea_purchases": [], "tea_blend_sales": []}
        try:
            db_session = SessionLocal()
            extractor = MSSQLExtractor(db_session)
            raw_data = extractor.extract_all()
            logger.info("Successfully extracted data from MSSQL database.")
        except Exception as e:
            logger.warning(f"Could not connect to MSSQL operational DB ({e}). Checking local/fallback mode.")
        finally:
            if db_session:
                db_session.close()

        # If MSSQL was empty or offline, populate realistic tea industry sample data
        if not raw_data["auctions"] and populate_samples_if_empty:
            logger.info("Operational DB returned 0 records. Populating simulated Ceylon Tea auction market data...")
            raw_data = generate_sample_tea_data()

        total_extracted = sum(len(v) for v in raw_data.values())
        logger.info(f"Total raw records extracted: {total_extracted}")

        # Transform into Star Schema
        transformer = StarSchemaTransformer(conn)
        dim_users = transformer.transform_users(raw_data["users"])
        dim_grades = transformer.transform_tea_grades(raw_data["auctions"])
        dim_blends = transformer.transform_tea_blends(raw_data["tea_blend_sales"])
        fact_auctions = transformer.transform_auctions(raw_data["auctions"], raw_data["bids"])
        fact_bids = transformer.transform_bids(raw_data["bids"])
        fact_blend_sales = transformer.transform_blend_sales(raw_data["tea_blend_sales"])
        fact_purchases = transformer.transform_tea_purchases(raw_data["tea_purchases"])

        # Data Quality Validation
        validator = DataQualityValidator(conn)
        valid_auctions, auc_quality = validator.validate_auctions(fact_auctions)
        valid_blend_sales, sales_quality = validator.validate_blend_sales(fact_blend_sales)

        checks_passed = auc_quality["passed"] + sales_quality["passed"]
        checks_failed = auc_quality["failed"] + sales_quality["failed"]
        logger.info(f"Data Quality Checks: {checks_passed} passed, {checks_failed} failed.")

        # Load into DuckDB Warehouse
        loader = DuckDBWarehouseLoader(conn)
        loader.load_users(dim_users)
        loader.load_tea_grades(dim_grades)
        loader.load_tea_blends(dim_blends)
        loaded_auc = loader.load_auction_transactions(valid_auctions, full_refresh=full_refresh)
        loader.load_bids(fact_bids, full_refresh=full_refresh)
        loader.load_blend_sales(valid_blend_sales, full_refresh=full_refresh)
        loader.load_tea_purchases(fact_purchases, full_refresh=full_refresh)
        total_loaded = loaded_auc + len(fact_bids) + len(valid_blend_sales) + len(fact_purchases)

        # Materialize Data Marts
        loader.refresh_data_marts()
        
        # Referential Integrity Check
        ref_check = validator.validate_referential_integrity()
        if not ref_check["is_valid"]:
            logger.warning(f"Referential integrity warning: {ref_check}")

        duration_ms = round((time.time() - start_time) * 1000, 2)
        status = "SUCCESS" if checks_failed == 0 else "WARNING"

        # Log pipeline run
        loader.log_pipeline_run({
            "run_id": run_id,
            "pipeline_name": "Batch_MSSQL_to_DuckDB_ELT",
            "execution_mode": execution_mode,
            "status": status,
            "records_extracted": total_extracted,
            "records_loaded": total_loaded,
            "duration_ms": duration_ms,
            "quality_checks_passed": checks_passed,
            "quality_checks_failed": checks_failed,
            "error_message": error_msg
        })

        logger.info(f"=== Pipeline Run [{run_id}] Finished in {duration_ms}ms with Status: {status} ===")

        return {
            "run_id": run_id,
            "status": status,
            "records_extracted": total_extracted,
            "records_loaded": total_loaded,
            "duration_ms": duration_ms,
            "quality_passed": checks_passed,
            "quality_failed": checks_failed
        }

    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        error_msg = str(e)
        logger.error(f"Pipeline Run [{run_id}] FAILED: {e}", exc_info=True)
        try:
            loader = DuckDBWarehouseLoader(conn)
            loader.log_pipeline_run({
                "run_id": run_id,
                "pipeline_name": "Batch_MSSQL_to_DuckDB_ELT",
                "execution_mode": execution_mode,
                "status": "FAILED",
                "records_extracted": total_extracted,
                "records_loaded": total_loaded,
                "duration_ms": duration_ms,
                "quality_checks_passed": checks_passed,
                "quality_checks_failed": checks_failed,
                "error_message": error_msg
            })
        except Exception:
            pass
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TeaBlendAI Batch ELT Pipeline Runner")
    parser.add_argument("--full-refresh", action="store_true", help="Perform full warehouse rebuild")
    args = parser.parse_args()

    res = run_batch_elt_pipeline(full_refresh=args.full_refresh)
    print("\n--- Pipeline Execution Summary ---")
    for k, v in res.items():
        print(f"  {k}: {v}")
