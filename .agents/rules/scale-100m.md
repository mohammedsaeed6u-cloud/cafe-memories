# 100M-User High-Scale & Enterprise Resilience Rules (قواعد البنية التحتية لتحمل 1M إلى 100M مستخدم)

These rules are mandatory for all production systems to ensure horizontal scalability, zero single-points-of-failure, sub-100ms response times, and resilience under massive traffic surges.

---

## 1. Multi-Tier Caching Architecture (التخزين المؤقت متعدد المستويات)
- **L1 (Edge / CDN):**
  - Cache all public and semi-static assets at the CDN edge (Cloudflare / Vercel Edge).
  - Use `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
  - Invalidate caches via Cache Tags / Surrogates on mutation; never rely solely on TTL.
- **L2 (Distributed In-Memory - Redis / Dragonfly):**
  - All hot database queries (read-heavy, user profiles, configurations) MUST be cached in Redis with jittered TTLs (`TTL = base_ttl + random(0, 300)`) to prevent **Cache Stampedes / Thundering Herds**.
  - Use Redis for shared session storage, distributed locks (`Redlock`), and real-time counters.
- **L3 (Application In-Memory):**
  - Cache immutable metadata, feature flags, and regex parsers in-process (e.g. LRU cache) with strict memory bounds (max 500MB).

---

## 2. Asynchronous Processing & Background Queues (فصل العمليات الثقيلة)
- **Zero Heavy Work in Request Path:**
  - An HTTP request must NEVER send an email, process an image, train a model, generate a PDF, or run complex analytics synchronously.
  - HTTP handlers MUST only validate input, push a payload to a persistent queue (QStash, BullMQ, SQS, Cloudflare Queues), and return `202 Accepted` with a job ID in `< 50ms`.
- **Worker Concurrency & Backpressure:**
  - Workers must process jobs with controlled concurrency and backpressure handling.
  - Every job must be strictly **idempotent** using a unique idempotency key (`idempotency_key = sha256(job_type + entity_id + timestamp)`).
  - Configure Dead Letter Queues (DLQ) with automatic retries (exponential backoff with jitter: 1s, 5s, 25s, 2m, DLQ).

---

## 3. Database Scaling & Query Discipline (قواعد البيانات الضخمة)
- **Connection Pooling Formula:**
  - Never allow serverless functions to connect directly to PostgreSQL. Always route through connection poolers (PgBouncer / Supabase Pooler / Prisma Accelerate).
  - Connection Pool Size = `((core_count * 2) + effective_spindle_count)`. Never exceed DB max connections.
- **Strict Indexing & Query Guardrails:**
  - Every `SELECT` query MUST be backed by an index (`EXPLAIN ANALYZE` must show `Index Scan`, NEVER `Seq Scan` on tables > 1,000 rows).
  - Compound indexes must follow the **ESR Rule**: Equality columns first, Sort columns second, Range columns last.
  - Add query timeouts: Set `statement_timeout = '3000ms'` in production to kill runaway queries before they lock resources.
  - Implement cursor-based pagination (`WHERE id > last_seen_id ORDER BY id ASC LIMIT 20`). **NEVER use `OFFSET`** on tables with > 10,000 rows (O(N) performance degradation).
- **Partitioning & Sharding (for 10M+):**
  - Partition tables exceeding 10M rows by Range (e.g. `created_at` monthly) or List (e.g. `tenant_id`).
  - Route read-only heavy queries to Read Replicas.

---

## 4. Traffic Defense & Rate Limiting (الحماية وتوزيع الأحمال)
- **Distributed Rate Limiting:**
  - Enforce Sliding Window Counter rate limiting on all API routes via Redis:
    * Public APIs: 60 req/min per IP.
    * Authenticated APIs: 600 req/min per User/Tenant.
    * AI / Generation APIs: 10 req/min per User with token bucket capacity.
- **Circuit Breakers:**
  - Wrap every external network call (Stripe, OpenAI, Supabase, Email) in a Circuit Breaker (e.g. `cockatiel` / `opossum`).
  - If error rate exceeds 50% over 10 seconds, open the circuit and return cached/fallback responses immediately without hammering the failing dependency.

---

## 5. Stateless Architecture & Horizontal Scaling (التوسع الأفقي)
- **Zero Local State on Servers:**
  - Application servers must be 100% stateless. No local file uploads (use S3 / Cloudflare R2), no sticky sessions (use Redis or signed JWT cookies).
  - Any server instance must be safely disposable at any second by an autoscaler.
- **Graceful Shutdown:**
  - Listen for `SIGTERM` / `SIGINT`. Stop accepting new requests, finish inflight requests (within 15s), close database pools, and flush logs before exit.

---

## 6. Observability, Telemetry & Health Checks (المراقبة والتشخيص اللحظي)
- **Correlation & Trace IDs:**
  - Generate a `X-Request-Id` / `traceparent` on every incoming request. Propagate it across all internal RPCs, database queries, and log statements.
- **Structured JSON Logging:**
  - Log exclusively in structured JSON (`timestamp`, `level`, `trace_id`, `tenant_id`, `path`, `duration_ms`, `status_code`).
- **Health Probes:**
  - `/api/health/live`: Returns 200 if the process is responsive.
  - `/api/health/ready`: Returns 200 only if DB pool and Redis connections are alive.
