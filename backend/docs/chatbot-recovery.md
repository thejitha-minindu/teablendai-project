# Chatbot credential and schema recovery

The November 1, 2026 investigation confirmed two independent failures:

- Docker's `--env-file` preserved literal quotes around `GOOGLE_API_KEY` and
  `TAVILY_API_KEY`. Provider probes rejected the quoted values (400/401) and
  accepted the same keys without those quotes (200/200).
- SQL Server reported low physical memory, and the joined/sorted schema catalog
  query waited on `RESOURCE_SEMAPHORE`. It repeatedly exceeded the query timeout.
  Separate catalog scans completed promptly on the same database.

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

The candidate passed 47 tests in a network-isolated container, including the
existing background-task, database-pool, outbox, and auction regressions and new
key-formatting, search-routing, and date-filter context cases. Profit-margin SQL
instructions now require aggregating mapped costs per sale before joining sales,
so a sale's revenue is counted once. Summaries receive the executed SQL to retain
the requested period even when date columns are absent from aggregated results:

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
