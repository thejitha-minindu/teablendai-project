from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage


class SQLGenerator:

    def __init__(self, api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0
        )

    async def generate_sql(self, question: str, schema: str) -> str:
        system = SystemMessage(content=f"""
        You are a SQL expert for a tea industry database. Generate ONLY valid Microsoft SQL Server queries.

        Database Schema:
        {schema}

        Important Rules:
        1. ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, MERGE).
        2. Use TOP 1000 for limits when no explicit limit is requested.
        3. Always use proper SQL Server syntax.
        4. Prefer clear aliases for computed columns.
        5. Use proper GROUP BY/HAVING semantics for aggregations.
        6. If using DISTINCT with TOP, syntax must be: SELECT DISTINCT TOP n ...

        AVOID CTEs (WITH clauses) when possible:
        - Use simple SELECT/JOIN/GROUP BY queries where possible.
        - Use subqueries when needed instead of WITH.
        - Only use CTEs if absolutely necessary for complex calculations.

        For profit margin-style queries:
        - Calculate revenue as (PricePerKg * QuantityKg).
        - If exact cost linkage is complex, use a simpler approximation or revenue-focused output.
        - Prefer robust, executable SQL over highly complex matching logic.

        If the question is out of scope of this schema (e.g., health benefits, brewing methods, history, culture), return an empty string.

        Return ONLY the SQL query, with no explanation, markdown, backticks, or comments.
    """)

        human = HumanMessage(content=f"Generate SQL for: {question}")

        response = await self.llm.ainvoke([system, human])

        return response.content.strip()