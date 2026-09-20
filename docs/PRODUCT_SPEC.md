# Product Specification & Requirements Document (PRD) — Café Memories

**Product Name:** Café Memories  
**Tagline:** The Digital Memory & Loyalty Layer for Specialty Cafés  
**Target Market:** Specialty coffee roasters, third-wave cafés, boutique coffee chains, and artisan bakeries  
**Target Scale:** 1M+ Registered Customers | 1,000+ Active Café Branches | 100,000 Daily Active Users  

---

## 1. Vision & Core Value Proposition

Café Memories transforms fleeting customer visits into durable emotional connections, quantifiable loyalty, and community engagement. Traditional loyalty cards (paper stamp cards or clunky native apps) suffer from an 82% abandonment rate. Café Memories eliminates app store download friction through zero-install dynamic QR scanning, gamified Web Audio stamp collection, instant photo memory sharing, and dynamic ambient Live TV Wall displays inside the venue.

### Key Value Pillars
1. **Zero-Friction Customer Onboarding:** No app download required. Scan a table QR code and the customer is instantly in the mobile web experience with a persistent anonymous identity.
2. **Emotional Loyalty over Transactional Discounts:** Customers don't just collect stamps; they co-create the café's digital atmosphere by projecting their memories onto the café's TV screens.
3. **Organic Viral Growth:** 9:16 Instagram Story and TikTok ready exports turn every customer into a micro-influencer for the café.
4. **Merchant Peace of Mind:** Real-time moderation queues with 1-click mobile approvals prevent inappropriate content while keeping the Live TV Wall vibrant and fresh.

---

## 2. User Personas & Journey Mapping

### Persona 1: Sarah — The Specialty Coffee Enthusiast (Café Guest)
- **Profile:** 27-year-old designer, visits local roasteries 3-4 times a week to work or socialize.
- **Goals:** Enjoy great coffee, document aesthetic moments, earn rewards without cluttering phone with native apps.
- **Friction Points:** Losing paper loyalty cards; remembering usernames/passwords for café Wi-Fi or loyalty programs.
- **Journey in Café Memories:**
  1. Scans table QR code with native phone camera.
  2. Instantly views branch-branded loyalty stamp card with audible coffee brewing stamp chime.
  3. Snaps photo of her cortado & pastry, applies "Golden Hour" coffee filter, writes a caption.
  4. Agrees to display on the Live Wall. Sees photo broadcast live to the venue TV within 10 seconds.
  5. Downloads custom 9:16 story frame to share on Instagram with café tag.

### Persona 2: Tariq — The Specialty Roastery Owner (Merchant Owner)
- **Profile:** Operates 4 busy urban specialty branches with high volume and discerning clientele.
- **Goals:** Increase repeat visit frequency, boost social media impressions, enhance in-store aesthetic.
- **Friction Points:** Fragmented POS data; staff giving away unauthorized free coffees; stale marketing posters.
- **Journey in Café Memories:**
  1. Sets up organization and 4 branches with custom color palette and logo.
  2. Pairs high-definition smart TVs in seating areas using 6-digit codes.
  3. Configures loyalty rules (e.g., 5th visit = Complimentary Flat White).
  4. Reviews live engagement analytics and approves photo memories from tablet or phone.

### Persona 3: Omar — The Head Barista / Shift Supervisor (Merchant Staff)
- **Profile:** Manages customer flow and counter interactions during peak rush hours.
- **Goals:** Fast checkout, delightful customer interactions, zero dispute over rewards.
- **Journey in Café Memories:**
  1. Verifies customer reward redemptions with 1-click scan or customer code check.
  2. Keeps tablet on counter to quickly approve guest photos during lulls.

---

## 3. Comprehensive Feature Matrix & Specifications

### 3.1. Dynamic QR & Smart Routing Engine
- **Unique Slugs:** Unique cryptographic slugs for every physical touchpoint (`table-01`, `counter-main`, `entrance-standee`, `receipt-qr`).
- **Analytics Ingress:** Logs scan source, time-of-day, and geolocation to help merchants optimize table turnover and signage placement.
- **Dynamic Redirect:** Automatically directs first-time visitors to the welcome/stamp card flow and returning visitors to their current streak status.

### 3.2. Customer Mobile Experience (`/c/[cafeSlug]`)
- **Responsive Chassis:** Authentic mobile presentation on smartphones; interactive iPhone 16 Pro mockup on desktop displays for merchant testing.
- **Web Audio Loyalty Chime:** Synthesized 3-harmonic pentatonic chime triggered on stamp achievement without external audio assets.
- **Photo Capture & Filter Suite:** In-browser WebRTC camera access or file selection with 3 custom CSS coffee grading presets:
  - *Warm Roast* (`sepia(0.3) saturate(1.2) contrast(1.05)`)
  - *Golden Hour* (`contrast(1.1) brightness(1.05) saturate(1.3)`)
  - *Vintage Espresso* (`grayscale(0.4) sepia(0.2) contrast(1.15)`)
- **Consent Gate:** Explicit, non-bundled checkboxes for:
  - Save to private memory vault.
  - Broadcast to in-venue Live TV Wall.
  - Permission for café social media marketing.
- **9:16 Story Card Generator:** High-resolution Canvas/SVG compositor rendering the guest's photo embedded in a luxury branded story frame with café badge, stamp badge, and date stamp.

### 3.3. Ambient Live TV Wall (`/wall/[screenId]`)
- **Cinematic Ken Burns Pan:** Continuous, silky smooth CSS pan and zoom animations (`scale(1.08) translate3d(-1%, -1%, 0)`) with 10-second crossfades.
- **Real-Time WebSockets:** Zero polling. Listens on PostgreSQL changes via Supabase Realtime; when a memory is approved, an animated toast alert notifies the room and queues the slide.
- **Ambient Glow Background:** Dynamic canvas background sampling dominant photo hues to cast an organic warm ambient backlight matching the current memory.
- **Offline & Reconnect Resilience:** Exponential backoff reconnection loop with local indexed memory fallback ensuring TV display never goes black during Wi-Fi drops.
- **Display Controls:** Keyboard hotkeys for baristas (`Space` = Pause/Play, `ArrowRight` = Next, `F` = Fullscreen toggle).

### 3.4. Merchant Administration & Moderation Dashboard (`/dashboard`)
- **Real-Time Moderation Queue:** Live feed of pending guest photos with optimistic approval/rejection and instant rollback on failure.
- **Multi-Branch Operations:** Centralized toggle to manage multiple physical locations under one organization.
- **Loyalty Rule Engine:** Configurable visit thresholds (e.g. 3, 5, 10 visits) and reward triggers (free beverage, bakery discount, merchandise).
- **Connected Screen Manager:** Live status monitoring of paired TV screens (online, offline, last heartbeat).
- **Customer CRM:** Searchable directory of customer regulars with visit frequency, streak counts, and memory histories.

---

## 4. Non-Functional Requirements (NFRs)

| Metric | Target Standard | Verification Method |
|---|---|---|
| **API Response Time (p95)** | < 120ms globally | Edge Route deployment on Vercel Edge Network |
| **TV Wall Latency** | < 1.5s from approval to TV broadcast | Elixir WebSocket broadcast direct from PostgreSQL WAL |
| **Mobile Bundle Size** | < 180KB gzip first load | Zero heavy UI frameworks, tree-shaken Lucide icons |
| **System Uptime** | 99.99% availability | Multi-region edge failover + managed Supabase HA |
| **Cold Start Latency** | < 25ms | Serverless Vercel Edge compute runtime |
| **Image Ingestion Cap** | 10MB original file size | Client-side Canvas downsampling + Edge Sharp validation |

---

## 5. Success Metrics & Business KPIs

1. **Scan-to-Stamp Conversion Rate:** Target > 75% of unique QR scans successfully completing a visit registration.
2. **Memory Creation Rate:** Target > 30% of visiting loyalty members publishing a photo memory.
3. **Live Wall Broadcast Consent:** Target > 65% of memory uploaders opting into public venue display.
4. **Viral Export Frequency:** Target > 15% of memory creators saving or sharing the 9:16 Instagram Story frame.
5. **Customer 30-Day Repeat Rate:** Target > 42% lift in repeat customer visits within 30 days compared to industry baseline.
