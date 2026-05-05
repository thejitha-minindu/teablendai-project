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
            "customer", "source type", "priceperkg", "quantitykg", "cost", "margin"
        ]

        auction_score = sum(1 for t in auction_terms if t in q)
        tea_score = sum(1 for t in tea_terms if t in q)

        if auction_score > tea_score:
            return "Use ONLY auction-domain tables unless the question explicitly asks to combine domains."
        if tea_score > auction_score:
            return "Use ONLY tea business-domain tables unless the question explicitly asks to combine domains."
        return "Choose the domain strictly from intent and do not mix unrelated tables."

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
        - If exact cost linkage is complex, use a simpler approximation or revenue-focused output.
        - Prefer robust, executable SQL over highly complex matching logic.

        Output-shape requirements for charting:
        - Return grouped data suitable for charts (time series, category breakdowns).
        - Ensure columns are explicit, stable, and clearly named.
        - Do not use SELECT * for aggregated/chart queries.

        If the question is out of scope of this schema (e.g., health benefits, brewing methods, history, culture), return an empty string.

        Return ONLY the SQL query, with no explanation, markdown, backticks, or comments.
    """)

        human = HumanMessage(content=f"Generate SQL for: {question}")

        response = await self.llm.ainvoke([system, human])

        return response.content.strip()