# EC2 API timeout recovery

The HTTP event loop was doing synchronous SQL work in the auction and outbox
background tasks. A slow database connection or query could therefore stall even
the static health endpoint. The previous 0.1-second outbox polling interval also
created unnecessary database traffic.

The fix keeps database sessions entirely inside worker threads and sends only
plain event data back to the HTTP loop for WebSocket broadcasts. Outbox reads are
closed before broadcasting, and delivery results are committed in a separate
worker transaction. Auction transitions, order creation, and outbox retries are
covered by regression tests.

The API's database modules now share one SQLAlchemy connection pool per process.
The pyodbc query timeout is applied before SQLAlchemy's initial connection queries,
as well as to later application queries. Other MCP processes have their own
connections; this is not a global connection limit across all processes.

## Production configuration

For the existing, provisioned EC2 database:

```dotenv
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=2
DATABASE_POOL_TIMEOUT=5
DATABASE_POOL_RECYCLE=1800
DATABASE_CONNECT_TIMEOUT_SECONDS=10
DATABASE_QUERY_TIMEOUT_SECONDS=15
AUCTION_POLL_INTERVAL_SECONDS=2
OUTBOX_POLL_INTERVAL_SECONDS=2
ANALYTICS_SCHEDULER_ENABLED=false
ANALYTICS_SNAPSHOT_INTERVAL_SECONDS=3600
RUNTIME_SCHEMA_COMPATIBILITY_ENABLED=false
MCP_WARMUP_ON_STARTUP=false
CORS_ORIGINS=["https://teablendai-project.vercel.app","https://teablendai.vercel.app","http://localhost:3000"]
```

Runtime schema compatibility checks issue many conditional schema-alteration
statements. Disable them only for an already provisioned production database;
apply schema migrations separately. Development retains the default `true`.
On-demand analytics endpoints remain available when the periodic scheduler is off.
AI clients initialize on the first chat request when startup warmup is disabled.
SQL Server schema extraction uses a fixed number of bulk catalog queries rather
than per-table reflection, and the database MCP server uses the same timeout/pool configuration.
Transient schema-extraction errors are not cached; a later chat request can retry.
The later [chatbot recovery](chatbot-recovery.md) replaces joined catalog queries
with simple scans and Python joins to avoid SQL Server memory-grant waits.

The database still needs sufficient resources. Thread offloading keeps HTTP
responsive; it cannot remove SQL Server locks, I/O waits, or memory pressure.
`/api/v1/health` is a liveness check and does not validate database readiness.

## Validation

These focused tests run with SQLite and simulated stalled SQL operations, without
connecting to RDS. They also cover connection sharing and auction lifecycle events.
They were run inside the production Python 3.12 image with container networking
disabled:

```bash
python -m pytest -q \
  tests/unit/test_background_responsiveness.py \
  tests/unit/test_database_pool.py \
  tests/unit/test_schema_catalog.py \
  tests/integration/test_outbox_publishing.py \
  tests/unit/test_outbox_repository.py \
  tests/unit/test_auction_service.py
```

For live validation, check repeated direct and HTTPS health requests, CORS
preflights from both frontend origins, and a deliberately nonexistent login.
That login should return HTTP 401 promptly; HTTP 422 is expected for a login
request with missing form fields.

## Verified results

The final candidate passed 32 regression tests. After deployment, five direct
health requests returned HTTP 200 in 2–3 milliseconds. A database-backed invalid
login returned HTTP 401 in 0.14–0.17 seconds. Browser tests on both hosted seller login
pages returned the expected unregistered-email message in 1.48 and 1.96 seconds,
with no API network errors. Public HTTPS health checks also passed three times.
The optimized RDS schema extraction returned 30 tables and relationships in
0.705 seconds.

## Deployment artifacts and rollback

The November 1, 2026 recovery uses image
`teablendai-backend:runtime-fix-20261101`. The rollout retains the original image as
`teablendai-backend:before-runtime-fix-20261101`, and preserves the existing
`teablendai_uploads` and `teablendai_warehouse` volumes.

Server-side rollout artifacts and environment backups are stored under
`/home/ubuntu/teablendai/runtime-fix-20261101`. Environment and container-inspection
backups contain credentials and have restricted permissions; do not commit them.

The final rollout retains the preceding healthy runtime as
`teablendai-backend-before-runtime-fix-20261101-v4`. To roll back that rollout:

```bash
sudo docker stop --timeout 30 teablendai-backend
sudo docker rename teablendai-backend teablendai-backend-runtime-fix-paused
sudo docker rename teablendai-backend-before-runtime-fix-20261101-v4 teablendai-backend
sudo cp /home/ubuntu/teablendai/runtime-fix-20261101/env-before-deployment-v4 /home/ubuntu/teablendai/.env.backend
sudo docker tag teablendai-backend:healthy-runtime-v3 teablendai-backend:rds
sudo docker start teablendai-backend
```

This restores the preceding healthy runtime and environment while retaining the patched
source for review. It does not remove persistent volumes.
