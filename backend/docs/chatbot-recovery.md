# Chatbot credential and schema recovery

## Preserving the dev chatbot workflow

I reviewed the official `origin/dev` branch at commit `19e24ec` against the
current `dev-thejitha` checkout. Its intended flow keeps classified tea
knowledge on web search, analytics on the database path, and unrelated requests
behind the topic guardrail. That separation is retained alongside the current
database pooling and schema fixes.

Production logs also showed Gemini HTTP 429 quota errors in both semantic
classification and NL-to-SQL generation. Clear tea analytics requests now use
local routing rules; an exact blend-margin report can be generated from the
known schema when Gemini is rate limited. If classification must fall back and
the request contains no tea or platform context, it is marked off topic instead
of being sent to the web search path. This restores the guardrail when Gemini is
unavailable and avoids presenting public web content as private analytics.

The workflow candidate passed 51 chatbot, database, background-task, outbox,
and auction tests. Against production services, the profit-margin question
returned 15 database rows in 3.37 seconds with Gemini quota errors present; the
Dimbula question returned 5 web sources and an answer in 6.31 seconds. The
deployed image and source checkout were verified to match.

The November 1, 2026 investigation confirmed two independent failures:

- Docker's `--env-file` preserved literal quotes around `GOOGLE_API_KEY` and
  `TAVILY_API_KEY`. Provider probes rejected the quoted values (400/401) and
  accepted the same keys without those quotes (200/200).
- SQL Server reported low physical memory, and the joined/sorted schema catalog
  query waited on `RESOURCE_SEMAPHORE`. It repeatedly exceeded the query timeout.
  Separate catalog scans completed promptly on the same database.
- The semantic intent classifier sometimes sent “What makes Dimbula tea unique?”
  to database retrieval. Tavily worked when called directly, but that routing
  bypassed web search in the actual chat flow.

`Settings` now removes surrounding whitespace and one matching pair of single or
double quotes from both AI keys. Every API and MCP client uses those settings.
No credentials are included in this change. Prefer plain values when supplying a
Docker environment file:

```dotenv
GOOGLE_API_KEY=replace-with-your-key
TAVILY_API_KEY=replace-with-your-key
```

Schema extraction now reads six small catalogs and joins/sorts the results in
Python. It preserves column types, primary keys, and composite foreign keys while
avoiding memory grants for a large SQL catalog join. The live candidate extracted
30 tables in 0.905 seconds and completed the reported natural-language query in
4.003 seconds. This does not remove the need for adequate RDS memory; unrelated
queries can still time out under resource pressure.

The chat service also restricts web fallback to public knowledge questions.
A failed private blend/profit query must not be mistaken for an empty generated
query and sent to a search engine.

The intent classifier now routes “What makes … unique/distinctive/special?”
directly to web knowledge. Search requests use Tavily's basic depth asynchronously
and have a 45-second MCP allowance. If Gemini cannot summarize results, the
search answer from Tavily is used; complete result excerpts are the final fallback
instead of returning a truncated sentence.

The database recovery candidate passed 47 tests in a network-isolated container, including the
existing background-task, database-pool, outbox, and auction regressions and new
key-formatting, search-routing, and date-filter context cases. Profit-margin SQL
instructions now require aggregating mapped costs per sale before joining sales,
so a sale's revenue is counted once. Summaries receive the executed SQL to retain
the requested period even when date columns are absent from aggregated results:

The web-routing change passed all 16 chatbot-specific cases. A live integration
through the deployed MCP client returned five Dimbula sources, a 700-character
answer, and `source=web` in 10.42 seconds including MCP startup. Public HTTPS
health returned 200 after deployment.

The web-search image is `teablendai-backend:web-search-fix-20261101`. The preceding
container is retained as
`teablendai-backend-before-web-search-fix-20261101-140047` for rollback.

```bash
python -m pytest -q \
  tests/unit/test_chatbot_configuration.py \
  tests/unit/test_schema_catalog.py \
  tests/unit/test_background_responsiveness.py \
  tests/unit/test_database_pool.py \
  tests/integration/test_outbox_publishing.py \
  tests/unit/test_outbox_repository.py \
  tests/unit/test_auction_service.py
```

The source-only candidate image is `teablendai-backend:chatbot-fix-20261101`.
EC2 build and deployment records are in
`/home/ubuntu/teablendai/chatbot-fix-20261101`. Private environment and container
backups stay on EC2 and must not be committed. Persistent uploads and warehouse
volumes are preserved during recreation.

The deployed image was verified against the real providers and database. Gemini
and Tavily authentication probes both returned HTTP 200. The exact reported
question returned 15 database rows, a bar chart, and a summary identifying 2024
in 12.192 seconds (17.547 seconds including separate MCP-client startup). Test
conversation history was kept in memory; the diagnostic did not create user
conversations. Public HTTPS health returned 200. The new container's recent logs
contained no key, schema, outbox, or auction errors at verification time.

The preceding container is retained as
`teablendai-backend-before-chatbot-fix-20261101-124112`. For rollback, stop and
rename the current container, rename that retained container to
`teablendai-backend`, and start it. Its original image and runtime environment
are retained. The corresponding environment-file backup is
`/home/ubuntu/teablendai/chatbot-fix-20261101/env-before-20261101-124112`.
