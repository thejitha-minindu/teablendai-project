"""Add order sync columns (display_order_id, seller_id, order_status, payment_status, timestamps)

Revision ID: a2b3c4d5e6f7
"""
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from sqlalchemy import text
from src.infrastructure.database.base import SessionLocal

def run_migration():
    db = SessionLocal()
    try:
        # Check which columns already exist on orders table
        existing = db.execute(text("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'orders'
        """)).fetchall()
        existing_cols = {row[0].lower() for row in existing}
        print(f"Existing columns: {existing_cols}")

        # Add display_order_id
        if 'display_order_id' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD display_order_id NVARCHAR(30) NULL"))
            print("Added display_order_id column")

        # Add seller_id
        if 'seller_id' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD seller_id UNIQUEIDENTIFIER NULL"))
            print("Added seller_id column")

        # Add order_status
        if 'order_status' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD order_status NVARCHAR(30) NOT NULL DEFAULT 'pending'"))
            print("Added order_status column")

        # Add payment_status
        if 'payment_status' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending'"))
            print("Added payment_status column")

        # Add created_at
        if 'created_at' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()"))
            print("Added created_at column")

        # Add updated_at
        if 'updated_at' not in existing_cols:
            db.execute(text("ALTER TABLE orders ADD updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()"))
            print("Added updated_at column")

        db.commit()
        print("Schema migration committed.")

        # --- Backfill existing rows ---
        # Populate seller_id from linked auction
        result = db.execute(text("""
            UPDATE o
            SET o.seller_id = a.seller_id
            FROM orders o
            INNER JOIN auctions a ON o.auction_id = a.auction_id
            WHERE o.seller_id IS NULL
        """))
        print(f"Backfilled seller_id for {result.rowcount} rows")

        # Populate display_order_id for existing rows
        rows = db.execute(text("""
            SELECT order_id, order_date FROM orders WHERE display_order_id IS NULL
        """)).fetchall()

        for row in rows:
            oid = row[0]
            odate = row[1]
            date_str = odate.strftime('%Y%m%d') if odate else '20260101'
            # Get the next sequence number for this date
            count = db.execute(text(f"""
                SELECT COUNT(*) FROM orders 
                WHERE display_order_id LIKE 'ORD-{date_str}-%'
            """)).scalar()
            seq = (count or 0) + 1
            display_id = f"ORD-{date_str}-{seq:03d}"
            db.execute(text(f"UPDATE orders SET display_order_id = '{display_id}' WHERE order_id = '{oid}'"))
            print(f"  Set display_order_id={display_id} for order {oid}")

        # Update payment_status for completed orders
        db.execute(text("""
            UPDATE orders SET payment_status = 'paid'
            WHERE status = 'completed' AND payment_status = 'pending'
        """))

        db.commit()
        print("Backfill migration completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Migration error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
