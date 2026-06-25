# pyrefly: ignore [missing-import]
import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.base import Base
from src.infrastructure.database.models.admin_tables_orm import TeaBlendSaleORM
from src.application.use_cases.admin.admin_csv_upload_service import AdminCSVUploadService
import io

class MockUploadFile:
    def __init__(self, content: bytes):
        self.file = io.BytesIO(content)

def test_parse_date_value_valid():
    service = AdminCSVUploadService(db=None)

    # None and empty values
    assert service._parse_date_value(None) is None
    assert service._parse_date_value("") is None
    assert service._parse_date_value("   ") is None

    # Date and datetime objects
    assert service._parse_date_value(date(2025, 1, 5)) == date(2025, 1, 5)

    # 4-digit year format variations
    assert service._parse_date_value("2025-01-05") == date(2025, 1, 5)
    assert service._parse_date_value("2025/01/05") == date(2025, 1, 5)
    assert service._parse_date_value("05/01/2025") == date(2025, 1, 5)
    assert service._parse_date_value("05-01-2025") == date(2025, 1, 5)

    # 2-digit year format variations
    assert service._parse_date_value("05-01-25") == date(2025, 1, 5)
    assert service._parse_date_value("05/01/25") == date(2025, 1, 5)

    # Datetime inputs (should extract the date portion)
    assert service._parse_date_value("2025-01-05 12:00:00") == date(2025, 1, 5)
    assert service._parse_date_value("05-01-25T14:30:00.123Z") == date(2025, 1, 5)


def test_parse_date_value_invalid():
    service = AdminCSVUploadService(db=None)

    with pytest.raises(ValueError) as excinfo:
        service._parse_date_value("invalid-date")
    assert "Invalid date format" in str(excinfo.value)

    with pytest.raises(ValueError) as excinfo:
        service._parse_date_value(12345)
    assert "Invalid date value type" in str(excinfo.value)


def test_process_csv_upsert():
    # Setup in-memory sqlite db
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # Pre-populate with an existing sale
        existing_sale = TeaBlendSaleORM(
            SaleID=1,
            CustomerID=10,
            BlendName="Original Blend",
            PricePerKg=500.0,
            QuantityKg=100.0,
            SaleDate=date(2024, 1, 1)
        )
        db.add(existing_sale)
        db.commit()

        # CSV Content: Row 1 updates SaleID 1, Row 2 inserts SaleID 2
        csv_content = (
            "SaleID,CustomerID,BlendName,PricePerKg,QuantityKg,SaleDate\n"
            "1,10,Updated Blend,600.0,150.0,2024-01-02\n"
            "2,12,New Blend,700.0,80.0,2024-02-01\n"
        ).encode("utf-8")

        mock_file = MockUploadFile(csv_content)
        mapping = {
            "SaleID": "SaleID",
            "CustomerID": "CustomerID",
            "BlendName": "BlendName",
            "PricePerKg": "PricePerKg",
            "QuantityKg": "QuantityKg",
            "SaleDate": "SaleDate"
        }

        service = AdminCSVUploadService(db)
        result = service.process_csv(mock_file, "TeaBlendSale", mapping)

        assert result["total_rows"] == 2
        assert result["successful_rows"] == 2
        assert result["failed_rows"] == 0

        # Query and assert changes
        all_sales = db.query(TeaBlendSaleORM).order_by(TeaBlendSaleORM.SaleID).all()
        assert len(all_sales) == 2

        # Assert update happened on ID 1
        assert all_sales[0].SaleID == 1
        assert all_sales[0].BlendName == "Updated Blend"
        assert float(all_sales[0].PricePerKg) == 600.0
        assert float(all_sales[0].QuantityKg) == 150.0
        assert all_sales[0].SaleDate == date(2024, 1, 2)

        # Assert insert happened on ID 2
        assert all_sales[1].SaleID == 2
        assert all_sales[1].BlendName == "New Blend"
        assert float(all_sales[1].PricePerKg) == 700.0
        assert float(all_sales[1].QuantityKg) == 80.0
        assert all_sales[1].SaleDate == date(2024, 2, 1)

    finally:
        db.close()
