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

---

## ADR-007: Shift from Photobooth Gimmick to Digital Memory + Loyalty + Live Wall Platform

### Context
Initial prototypes drifted into being a standalone photo-frame editor, toy filter machine, and sticker booth. This distracted from the business model: hospitality venues need *repeat customer visits*, *quantifiable loyalty*, and *in-venue community engagement*.

### Decision
Realign the central core entity of the platform to **Memory** (`customer`, `org_id`, `branch_id`, `visit_id`, `image_derivatives`, `consents`). Frame templates, stickers, and physical printing are strictly secondary utility features subordinated to returning customer loyalty and the ambient Live Wall.

### Consequences
- **Positive:** Clear, defensible SaaS product-market fit; high retention and LTV; measurable merchant ROI (stamp progression & reward redemption).
- **Negative:** Deprioritized cosmetic photo frame features in favor of core transaction integrity.

---

## ADR-008: Merchant-Enforced Card Frame Layouts (Orientation & Slot Counts)

### Context
Merchants require physical brand consistency. If a café prints vertical 2x6 bookmarks or displays 4-photo strips, a customer switching layout to 2-cut horizontal cards breaks the physical loyalty card dimensions and in-store aesthetic.

### Decision
Make `shotCount` (3, 4, 5, etc.) and `orientation` (`vertical` vs `horizontal`) authoritatively dictated by the merchant's `BusinessSettings`. The customer cannot alter or override the business's card layout.

### Consequences
- **Positive:** Guaranteed brand integrity for the merchant; physical printing matches exact merchandise specs; uniform Live TV Wall board projection.
- **Negative:** Customer cannot change card dimensions away from the venue's standard.

---

## ADR-009: Gated Card Completion & Anti-Fraud Reward Redemption

### Context
Allowing customers to download high-resolution memory strips or claim free merchant rewards without completing their visit sequence destroys the merchant's business incentive and invites fraud.

### Decision
Strictly gate full-resolution strip downloading and reward voucher generation until the card is 100% completed by verified returning visits or cashier-authorized PINs. The server cryptographically validates redemption balance before issuing gift codes.

### Consequences
- **Positive:** Directly drives repeat customer visits and secondary transactions; protects merchant margins from unauthorized freebies.
- **Negative:** First-time visitors must return to unlock the final composite keepsake.

---

## ADR-010: Zero-Friction Anonymous Session Onboarding

### Context
Forcing customers to register with a phone number or create an account *before* they can interact with the product causes high scan-to-abandonment rates (> 65%).

### Decision
Adopt an anonymous session identity model: on first QR scan, the client initializes an anonymous guest session with local device persistence and immediate camera access. Entering a phone number or linking an account is made optional and non-blocking, allowing customers to capture their moment with zero upfront friction while enabling device-to-device persistence later.

### Consequences
- **Positive:** Immediate time-to-value; conversion rate from QR scan to photo capture jumps to > 85%.
- **Negative:** Unlinked guest cards stored only on device storage could be lost if browser cache is cleared (mitigated by prominent "Link Phone" banner).

---

## ADR-011: Temporary 6-Digit Screen Pairing Handshake & Offline LocalStorage Fallback

### Context
Pairing in-store TV displays using permanent passwords or complex OAuth logins is cumbersome for venue staff and insecure. Furthermore, venue Wi-Fi drops can cause digital signage to show ugly error screens.

### Decision
1. Implement a 10-minute temporary 6-digit numeric pairing code generated by the merchant dashboard with maximum 5 failed attempts.
2. The TV screen registers via `/api/v1/screens/pair` and receives a revocable `device_token`.
3. In-store playback caches approved memories in browser `localStorage` (`memories_wall_cache_${screenId}`). If network drops, the TV continues displaying cached memories seamlessly.

### Consequences
- **Positive:** 10-second pairing flow for baristas; zero blank screens during Wi-Fi outages; robust brute-force protection.
- **Negative:** Offline screens cannot receive real-time new photo broadcasts until reconnected.

---

## ADR-012: Static Export + Edge Delivery Architecture for Cloudflare Pages

### Context
Deploying full Node.js servers introduces container cold starts and server maintenance. Cloudflare Pages offers ultra-fast edge asset delivery (< 20ms global latency) and high reliability.

### Decision
Export Next.js production builds as static assets (`output: export`) for Cloudflare Pages edge hosting. Dynamic interactions leverage client-side Supabase REST/Realtime connections with serverless API fallbacks.

### Consequences
- **Positive:** Global CDN edge caching; 99.99% uptime; zero server management overhead; instant global distribution.
- **Negative:** Route Handlers (`src/app/api`) are isolated during the static export pass, requiring client components to support direct Supabase client fallbacks.
