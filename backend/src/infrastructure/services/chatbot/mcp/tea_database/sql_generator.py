import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from src.config import get_settings


class SQLGenerator:

    def __init__(self, api_key: str):
        settings = get_settings()
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=api_key,
            temperature=0
        )

    @staticmethod
    def _infer_domain_hint(question: str) -> str:
        """Infer likely domain to reduce cross-domain table mistakes."""
        q = question.lower()

        auction_terms = [
            "auction", "bid", "bids", "order", "orders", "seller", "buyer",
            "sold_price", "base_price", "estate_name", "grade"
        ]
        tea_terms = [
            "blend", "purchase", "teapurchase", "teablendsale", "composition",
            "customer", "source type", "priceperkg", "quantitykg", "cost", "margin",
            "tea grade", "standard", "bop", "bopf", "op", "fbop", "dust1", "pekoe",
            "dust", "opa", "factory", "broker", "blend name", "blendname", "ratio",
            "blendid", "saledate", "purchasedate", "quantityusedkg", "mappingid",
            "region", "colombo", "kandy", "galle", "jaffna", "rathnapura", "matara",
            "nuwara eliya","mathale","sabaragamuwa","dimbula","uva","kandurata",
            "europe", "middle east", "russia", "japan", "usa", "ceylon gold",
            "highland premium", "royal bop", "export classic", "silver tips",
            "supply chain", "traceability", "unused", "utilization", "profitability",
            "revenue", "margin", "profit"
        ]

        auction_score = sum(1 for t in auction_terms if t in q)
        tea_score = sum(1 for t in tea_terms if t in q)

        if auction_score > tea_score:
            return "Use ONLY auction-domain tables unless the question explicitly asks to combine domains."
        if tea_score > auction_score:
            return "Use ONLY tea business-domain tables unless the question explicitly asks to combine domains."
        return "Choose the domain strictly from intent and do not mix unrelated tables."

    @staticmethod
    def _known_tea_margin_query(question: str, schema: str) -> str | None:
        """Generate the supported blend-margin report if Gemini is unavailable."""
        normalized = question.lower()
        required_terms = ("profit", "margin")
        if (not all(term in normalized for term in required_terms)
                or not any(term in normalized for term in ("blend", "tea"))):
            return None
        schema_lower = schema.lower()
        if not all(table.lower() in schema_lower for table in
                   ("TeaBlendSale", "BlendPurchaseMapping", "TeaPurchase")):
            return None

        year_match = re.search(r"\b(20\d{2})\b", normalized)
        date_filter = ""
        if year_match:
            year = int(year_match.group(1))
            if year < 2000 or year > 2100:
                return None
            date_filter = (
                f"WHERE tbs.SaleDate >= '{year}-01-01' "
                f"AND tbs.SaleDate < '{year + 1}-01-01'"
            )

        return f"""SELECT TOP 100 tbs.BlendName,
    SUM(tbs.PricePerKg * tbs.QuantityKg) AS total_revenue,
    SUM(cost_per_sale.total_cost) AS total_cost,
    100.0 * (SUM(tbs.PricePerKg * tbs.QuantityKg) - SUM(cost_per_sale.total_cost))
        / NULLIF(SUM(tbs.PricePerKg * tbs.QuantityKg), 0) AS profit_margin_percentage
FROM TeaBlendSale AS tbs
JOIN (
    SELECT bpm.SaleID, SUM(tp.PricePerKg * bpm.QuantityUsedKg) AS total_cost
    FROM BlendPurchaseMapping AS bpm
    JOIN TeaPurchase AS tp ON tp.PurchaseID = bpm.PurchaseID
    GROUP BY bpm.SaleID
) AS cost_per_sale ON cost_per_sale.SaleID = tbs.SaleID
{date_filter}
GROUP BY tbs.BlendName
ORDER BY profit_margin_percentage DESC"""

    async def generate_sql(self, question: str, schema: str) -> str:
        domain_hint = self._infer_domain_hint(question)

        system = SystemMessage(content=f"""
        You are an expert T-SQL query generator for a tea business and auction analytics platform.
        Generate ONLY valid, executable Microsoft SQL Server SELECT queries.

        Database Schema:
        {schema}

        Domain intent routing (mandatory):
        - Auction analytics questions: use ONLY dbo.auctions, dbo.bids, dbo.orders, dbo.users.
        - Tea production/sales questions: use ONLY TeaPurchase, TeaBlendSale, BlendComposition, Customer, BlendPurchaseMapping.
        - Never mix domains unless the user explicitly requests cross-domain analysis.
        - {domain_hint}

        Required JOIN paths (mandatory when corresponding tables are used):
        - dbo.auctions.auction_id = dbo.bids.auction_id
        - dbo.auctions.auction_id = dbo.orders.auction_id
        - dbo.orders.user_id = dbo.users.user_id
        - TeaBlendSale.SaleID = BlendComposition.BlendID
        - TeaBlendSale.SaleID = BlendPurchaseMapping.SaleID
        - TeaPurchase.PurchaseID = BlendPurchaseMapping.PurchaseID
        - TeaBlendSale.CustomerID = Customer.CustomerID

        Auction Status Values (critical for filtering):
        - dbo.auctions.status has exactly three valid values: 'Live', 'Scheduled', 'History'
        - 'Live': Auction is currently active and accepting bids
        - 'Scheduled': Auction is scheduled for the future but not yet live
        - 'History': Auction has ended and is in the historical record
        - When user asks for "live auctions", use WHERE status = 'Live'
        - When user asks for "scheduled auctions", use WHERE status = 'Scheduled'
        - When user asks for "past auctions" or "completed auctions", use WHERE status = 'History'
        - If the user specifies a particular status type, filter explicitly by that status value
        - If the user does not specify a status, do not filter by status unless the question clearly implies it

        Tea table reference (Sri Lankan tea business domain):

        TeaPurchase (PurchaseID INT PK, SourceType VARCHAR(20), Standard VARCHAR(20),
                     PricePerKg DECIMAL(10,2), QuantityKg DECIMAL(10,2), PurchaseDate DATE)
          - SourceType values: 'Factory', 'Broker'
          - Standard values: 'BOP', 'BOPF', 'OP', 'FBOP', 'Dust1', 'Pekoe', 'Dust', 'OPA'
          - PricePerKg range: 350–2200 LKR/kg
          - QuantityKg range: 50–5000 kg
          - PurchaseDate range: 2015-01-01 to 2026-04-30

        Customer (CustomerID INT PK, Name VARCHAR(100), Region VARCHAR(100))
          - Region values: 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala', 'Matara',
                           'Europe', 'Middle East', 'Russia', 'Japan', 'USA'

        TeaBlendSale (SaleID INT PK, CustomerID INT FK→Customer, BlendName VARCHAR(100),
                      PricePerKg DECIMAL(10,2), QuantityKg DECIMAL(10,2), SaleDate DATE)
          - BlendName examples: 'Ceylon Gold', 'Highland Premium', 'Royal BOP Blend',
                                'Export Classic', 'Silver Tips Mix'
          - PricePerKg range: 900–3500 LKR/kg (always higher than purchase prices)
          - QuantityKg range: 10–5000 kg
          - SaleDate range: 2015-01-01 to 2026-04-30
          - Revenue = PricePerKg * QuantityKg

        BlendComposition (BlendID INT FK→TeaBlendSale.SaleID, Standard VARCHAR(20), Ratio DECIMAL(5,2))
          - Each BlendID has 2–5 rows; Ratio values for the same BlendID sum to exactly 1.00
          - Standard values match TeaPurchase.Standard

        BlendPurchaseMapping (MappingID INT PK, SaleID INT FK→TeaBlendSale, PurchaseID INT FK→TeaPurchase,
                              Standard VARCHAR(20), QuantityUsedKg DECIMAL(10,2))
          - Standard matches TeaPurchase.Standard for the referenced PurchaseID
          - QuantityUsedKg is 5–40% of the original purchase QuantityKg
          - Links blend sales back to raw material purchases (supply chain traceability)

        Tea business logic rules:
        - "Tea grade" and "standard" are interchangeable — both refer to TeaPurchase.Standard / BlendComposition.Standard.
        - Total purchase quantity for a grade: SUM(QuantityKg) FROM TeaPurchase GROUP BY Standard.
        - Blend revenue: SUM(PricePerKg * QuantityKg) FROM TeaBlendSale.
        - Blend cost (approximate): SUM(tp.PricePerKg * bpm.QuantityUsedKg) via BlendPurchaseMapping JOIN TeaPurchase.
        - Gross margin per blend: (sale revenue - mapped purchase cost) / sale revenue * 100.
        - Unused purchase stock: TeaPurchase.QuantityKg - SUM(BlendPurchaseMapping.QuantityUsedKg).
        - "Utilization rate": SUM(QuantityUsedKg) / TeaPurchase.QuantityKg for a given purchase.
        - International customers: Region IN ('Europe', 'Middle East', 'Russia', 'Japan', 'USA').
        - Local customers: Region IN ('Colombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala', 'Matara').

        Important Rules:
        1. ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, MERGE, EXEC).
        2. Use TOP 1000 when no explicit result size is requested.
        3. Always use SQL Server syntax and schema-qualified names where possible (e.g., dbo.auctions).
        4. Use clear, visualization-ready aliases: total_sales, avg_price, total_quantity, total_revenue, auction_count, bid_count, customer_count, sale_date, month_label.
        5. Use correct GROUP BY/HAVING semantics for aggregations.
        6. If using DISTINCT with TOP, syntax must be: SELECT DISTINCT TOP n ...
        7. Handle NULL safely with COALESCE or ISNULL for numeric outputs.
        8. Avoid unnecessary joins and filter early in WHERE.
        9. Prefer readable, clean T-SQL.

        Volume interpretation rules:
        - "auction volume" means the total quantity listed in auctions, usually SUM(quantity).
        - "sales volume" means the total quantity sold or the number of sold auctions, depending on the question context.
        - Do not use sold_price when the user asks about volume unless they explicitly ask about revenue, price, value, or sales amount.
        - If the question compares auction volume to sales volume, keep both measures in quantity/count terms.
        - "total quantity purchased for each tea grade" → SELECT Standard, SUM(QuantityKg) FROM TeaPurchase GROUP BY Standard.

        Business logic rules:
        - Revenue = PricePerKg * QuantityKg (for TeaBlendSale).
        - Auction success means sold_price IS NOT NULL.
        - Blend cost can be derived from mapped purchases via BlendPurchaseMapping and TeaPurchase.
        - For blend margin style outputs, expose both revenue and cost when possible.

        Price filtering rules (critical for accurate metrics):
        - For price comparisons, averages, or trend analysis: filter price columns with > 0 (not just IS NOT NULL).
        - Example: WHERE sold_price > 0 gives accurate averages; WHERE sold_price IS NOT NULL may include zero/invalid prices.
        - When comparing base_price vs sold_price: use WHERE base_price > 0 AND sold_price > 0 for both measures.
        - For revenue calculations: filter PricePerKg > 0 and QuantityKg > 0 to exclude invalid records.
        - NULL checks alone are insufficient for financial metrics; always validate positive values.

        Aggregation rules:
        - Use SUM for revenue and quantities.
        - Use AVG for price trends.
        - Use COUNT for activity metrics (bids, auctions, customers).

        Time-series rules:
        - For daily trends, group by CAST(<datetime> AS date).
        - For monthly trends, group by YEAR(<datetime>), MONTH(<datetime>).
        - For yearly trends, group by YEAR(<datetime>).
        - Include sortable time keys and readable labels when relevant.
        - Use SQL Server date filtering patterns:
          - Last 7 days: <date_col> >= DATEADD(DAY, -7, GETDATE())
          - Last month: <date_col> >= DATEADD(MONTH, -1, GETDATE())
          - Last year: <date_col> >= DATEADD(YEAR, -1, GETDATE())

        AVOID CTEs (WITH clauses) when possible:
        - Use simple SELECT/JOIN/GROUP BY queries where possible.
        - Use subqueries when needed instead of WITH.
        - Only use CTEs if absolutely necessary for complex calculations.

        For profit margin-style queries:
        - Calculate revenue as (PricePerKg * QuantityKg).
        - Aggregate mapped purchase costs by SaleID FIRST, using BlendPurchaseMapping JOIN TeaPurchase.
        - Join that one-row-per-sale cost subquery to TeaBlendSale, then group by BlendName.
        - Count each sale's revenue exactly once. Never SUM sale revenue directly over the one-to-many purchase-mapping join.
        - Calculate margin as 100.0 * (SUM(sale revenue) - SUM(mapped cost)) / NULLIF(SUM(sale revenue), 0).
        - Apply requested dates to TeaBlendSale.SaleDate before aggregation; use a half-open date range for a specific year.
        - Return the calculated margin, not revenue presented as a substitute for profit margin.

        Output-shape requirements for charting:
        - Return grouped data suitable for charts (time series, category breakdowns).
        - Ensure columns are explicit, stable, and clearly named.
        - Do not use SELECT * for aggregated/chart queries.

        If the question is out of scope of this schema (e.g., health benefits, brewing methods, history, culture), return an empty string.

        Return ONLY the SQL query, with no explanation, markdown, backticks, or comments.
    """)

        human = HumanMessage(content=f"Generate SQL for: {question}")

        try:
            response = await self.llm.ainvoke([system, human])
        except Exception:
            fallback_sql = self._known_tea_margin_query(question, schema)
            if fallback_sql:
                return fallback_sql
            raise

        return response.content.strip()
