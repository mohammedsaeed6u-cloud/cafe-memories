# Architecture Decision Records (ADRs) — Café Memories

**Format:** Michael Nygard Architecture Decision Record (ADR) Standard  
**Document Status:** Approved & Implemented  

---

## ADR-001: Next.js 16 App Router on Vercel Global Edge Network

### Context
Café Memories requires instant QR code resolution (< 50ms) in brick-and-mortar cafés worldwide where mobile reception can be spotty. Traditional containerized servers in a single region introduce 250–500ms round-trip latency for international locations.

### Decision
Deploy Next.js 16 with React 19 Server Components on Vercel's global edge network. Route handlers for QR redirects and static assets execute directly on Edge nodes nearest to the user.

### Consequences
- **Positive:** Sub-30ms time-to-first-byte (TTFB) on QR scans globally; automatic DDoS mitigation; effortless auto-scaling from 0 to 50,000 requests/minute.
- **Negative:** Edge runtime does not support native C++ binaries (mitigated by routing `sharp` media processing to Node.js serverless functions).

---

## ADR-002: PostgreSQL Row-Level Security (RLS) for Multi-Tenancy

### Context
In a multi-tenant SaaS serving thousands of independent coffee brands, data leakage between tenants (e.g., Brand A seeing Brand B's customer roster or daily revenue) represents an existential business risk.

### Decision
Enforce multi-tenancy at the database level using native PostgreSQL Row-Level Security (RLS) rather than relying exclusively on application code `WHERE organization_id = ...` clauses.

### Consequences
- **Positive:** Mathematically eliminates Insecure Direct Object Reference (IDOR) vulnerabilities across tenants; secure even if junior engineers omit application-level filters.
- **Negative:** Slight query overhead on complex joins (mitigated by optimizing helper functions with `STABLE` caching and composite B-Tree indexes).

---

## ADR-003: Supabase Realtime (Elixir Phoenix WebSockets) for TV Wall

### Context
In-venue Live TV Walls need to refresh immediately when a barista approves a guest photo. Polling the database from thousands of TV screens every 2 seconds would create millions of unnecessary database queries, inflating costs and risking pool exhaustion.

### Decision
Use Supabase Realtime (Phoenix Channels / Elixir WebSocket engine) listening to PostgreSQL Write-Ahead Log (WAL) logical replication.

### Consequences
- **Positive:** Zero database load for connected idle screens; sub-50ms push notification latency to TV displays; Elixir cluster effortlessly scales to millions of concurrent WebSockets.
- **Negative:** Requires persistent outbound WebSocket connection on café Wi-Fi (mitigated by automatic reconnection with exponential backoff).

---

## ADR-004: Dual-Stage Media Optimization (Canvas + Edge Sharp)

### Context
Smartphone cameras produce 12–48 megapixel images (8–15 MB). Uploading raw photos over crowded café Wi-Fi or 4G leads to 10+ second upload times, high failure rates, and enormous cloud storage costs.

### Decision
Implement client-side HTML5 Canvas downsampling to 1920px max dimension before transmission, followed by server-side Sharp processing into WebP derivatives (1080px for TV Wall, 320px for mobile cards).

### Consequences
- **Positive:** Cuts mobile upload payload by 85%; reduces upload time from 8s to 1.2s; slashes storage and CDN egress costs by ~80%.
- **Negative:** Requires client device CPU to render Canvas (virtually imperceptible on modern smartphones).

---

## ADR-005: Idempotency Key Pattern for Anti-Fraud Loyalty & Financial Events

### Context
Network retries on mobile devices can cause duplicate requests. Without deduplication, a customer might receive multiple stamps or reward unlocks for a single coffee purchase.

### Decision
Require an `idempotency_key` (UUIDv4) on all reward redemption and visit creation requests, enforced by a `UNIQUE` database constraint on `reward_events`.

### Consequences
- **Positive:** Guaranteed single-execution semantics; network retries safely return identical receipts without double-deductions.
- **Negative:** Clients must generate and persist UUIDs across retries.

---

## ADR-006: Web Audio API Synthesized Loyalty Chime

### Context
A physical feedback loop (delightful stamp sound) is critical for gamified loyalty. Loading external MP3 audio files on mobile web suffers from network latency, silent playback failures on iOS, and asset bandwidth costs.

### Decision
Synthesize a custom 3-tone pentatonic coffee chime directly in the browser using the native Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`).

### Consequences
- **Positive:** Zero bytes of external asset downloads; instant zero-latency audio playback; 100% reliability even in offline PWA state.
- **Negative:** Requires user gesture before first playback per browser autoplay policies (naturally satisfied by the user tapping "Stamp").
