# Scale & Capacity Engineering Model — Café Memories

**Target Customer Scale:** 1,000,000 Registered Customers  
**Active Merchant Network:** 1,000 Café Branches  
**Daily Active Users (DAU):** 100,000 Unique Visitors/Day  
**Peak Traffic Modeling:** 10,000 Concurrent Active Sessions | 5,000 HTTP Requests/Sec Peak Burst  

---

## 1. Traffic & Ingress Capacity Modeling

Specialty coffee traffic exhibits distinct diurnal peaks corresponding to morning rush (07:30–09:30) and afternoon study/social rush (15:00–18:00). Capacity planning must accommodate a 5x surge above daily baseline averages.

| Metric | Daily Average | Peak Hour (5x) | Peak Burst (10s window) |
|---|---|---|---|
| **QR Code Scans** | 150,000 / day | 37,500 / hr (10.4 RPS) | 250 RPS |
| **Visit Registrations** | 100,000 / day | 25,000 / hr (7.0 RPS) | 180 RPS |
| **Memory Uploads** | 30,000 / day | 7,500 / hr (2.1 RPS) | 60 RPS |
| **Live Wall Realtime Events** | 25,000 / day | 6,250 / hr (1.7 RPS) | 50 RPS |
| **Total Gateway Requests** | ~1,200,000 / day | ~300,000 / hr (83.3 RPS) | **5,000 RPS** (Simulated Spike) |

---

## 2. Compute & Serverless Execution Sizing

### 2.1. Edge Compute (Vercel Global Edge Network)
- **Execution Model:** Edge Runtime for QR redirection (`/go/[qrSlug]`), static asset delivery, and middleware. Node.js serverless runtime for image processing (`sharp`) and complex database transactions.
- **Cold Start Latency:** Edge functions < 15ms; Serverless Node.js functions < 180ms.
- **Concurrency Budget:** Vercel Pro/Enterprise allocation supports up to 30,000 concurrent lambdas with auto-scaling within milliseconds.

### 2.2. Database Connection Pooler (PgBouncer)
- **Problem:** If 1,000 serverless functions open direct PostgreSQL connections simultaneously, PostgreSQL max connections (typically 100–300) will saturate, throwing `FATAL: remaining connection slots are reserved`.
- **Architecture:** All API routes connect through PgBouncer on port `6543` with `pool_mode = transaction`.
- **Capacity:** A pool of 60 physical backend connections comfortably supports 10,000 concurrent serverless requests because individual transaction durations average < 8ms.

---

## 3. Database Sizing, IOPS & Storage Growth

### 3.1. 1-Year Data Ingestion Projections

| Table Name | Avg Row Size | Rows / Day | Daily Growth | Annual Growth (365d) |
|---|---|---|---|---|
| `visits` | 280 bytes | 100,000 | 28.0 MB | 10.2 GB |
| `memories` | 420 bytes | 30,000 | 12.6 MB | 4.6 GB |
| `memory_consents` | 180 bytes | 30,000 | 5.4 MB | 2.0 GB |
| `reward_events` | 210 bytes | 120,000 | 25.2 MB | 9.2 GB |
| `audit_logs` | 350 bytes | 40,000 | 14.0 MB | 5.1 GB |
| **Total Relational Storage** | - | - | **~85.2 MB / day** | **~31.1 GB / year** |

### 3.2. Disk IOPS Requirements
- **Write IOPS:** 100 writes/sec baseline, 500 writes/sec peak. Standard SSD with 3,000 baseline IOPS and burst up to 10,000 IOPS provides a 6x safety headroom.
- **Read IOPS:** 95% of reads for active QR codes and branch branding are absorbed by edge caching. Database read IOPS remain well below 400 IOPS.

---

## 4. Object Storage & CDN Bandwidth Calculations

### 4.1. Media Ingestion Sizing
- **Daily Uploads:** 30,000 photos / day.
- **Original Archive (Coldline):** 30,000 x 500 KB = 15.0 GB / day.
- **Optimized WebP (Live Wall):** 30,000 x 180 KB = 5.4 GB / day.
- **Thumbnail WebP (Mobile Cards):** 30,000 x 35 KB = 1.05 GB / day.
- **Total Storage Ingestion:** ~21.45 GB / day (~643 GB / month).

### 4.2. CDN Egress & Cache Hit Ratio
- 1,000 TV walls running 14 hours/day rotating through 50 photos every 10 seconds.
- Total daily TV wall impressions = 1,000 x 5,040 rotations = 5,040,000 views.
- With `Cache-Control: public, max-age=31536000, immutable` and Cloudflare/Supabase Edge CDN:
  - **CDN Edge Cache Hit Ratio:** **98.4%**.
  - **Origin Egress:** Only 1.6% of image requests hit the storage origin.
  - **Origin Bandwidth Consumption:** < 15 GB / day.

---

## 5. Supabase Realtime WebSocket Capacity

- **Active Wall Displays:** 1,000 connected TV screens maintaining persistent WebSocket channels.
- **Heartbeat Overhead:** 1 heartbeat ping every 30 seconds per screen = 33.3 pings/second across the entire cluster.
- **Broadcast Fan-Out:** When a photo is approved at a specific branch, the message is routed *only* to the specific branch topic (`screen:branch:[branch_id]`).
- **Cluster Load:** Phoenix Elixir nodes handle 2,000,000 concurrent WebSockets on single bare-metal instances; 1,000 connected screens utilize less than 0.2% of cluster capability.
