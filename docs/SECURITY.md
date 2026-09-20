# Security & Threat Modeling Specification — Café Memories

**Security Standard:** Zero Trust Architecture & Defense-in-Depth  
**Compliance Standards:** SOC 2 Type II, OWASP Top 10 (2025/2026), GDPR, CCPA  
**Classification:** Enterprise SaaS Security Specification  

---

## 1. STRIDE Threat Model & Defense Matrix

| Threat Category | Potential Vector | Impact | Engineering Defense |
|---|---|---|---|
| **Spoofing** | Forged customer token or stolen session cookie | Unauthorized access to another user's loyalty rewards | Signed Supabase JWTs with httpOnly, Secure, SameSite=Lax cookies. Anonymous sessions bounded by HMAC-SHA256 device fingerprint. |
| **Tampering** | Manipulating visit timestamps or reward points in transit | Fraudulent free coffee redemptions | Cryptographic idempotency keys on all financial/reward events; all business logic computed server-side inside PostgreSQL transactions. |
| **Repudiation** | Merchant staff denying improper deletion of customer photos | Unaccountable content moderation | Cryptographic `audit_logs` capturing `actor_id`, `action`, `ip_address`, `target_id` with RLS preventing modification. |
| **Information Disclosure** | Direct Object Reference (IDOR) attacks across tenants | Café A viewing Café B's sales volume, customers, or photos | Mandatory PostgreSQL Row Level Security (RLS) policies scoped to `organization_id`. Application queries run under unprivileged connection roles. |
| **Denial of Service** | Uploading massive 100MB files or hammering QR endpoints | Server exhaustion, cloud bill inflation | 10MB upload limit with streaming byte count guard; edge sliding-window rate limiting; client-side image downsampling. |
| **Elevation of Privilege** | Barista account executing organization deletion | Destruction of multi-branch business data | RBAC enums (`owner`, `admin`, `manager`, `staff`) enforced at both Next.js API Gateway and PostgreSQL RLS functions (`is_org_admin`). |

---

## 2. Authentication & Role-Based Access Control (RBAC)

### 2.1. Customer Identity Lifecycle
1. **Anonymous First-Visit:** Customers scan QR codes and receive an anonymous session backed by a cryptographic device UUID stored in Secure LocalStorage and sent in `x-client-fingerprint`.
2. **Identity Linkage:** When the customer connects via Google OAuth or Magic Link, an atomic transaction reconciles the `anonymous_id` with `auth.users.id`, transferring all accumulated loyalty stamps seamlessly.

### 2.2. Merchant & Staff RBAC Matrix

| Permission Domain | Owner | Admin | Manager | Staff (Barista) | Customer |
|---|:---:|:---:|:---:|:---:|:---:|
| **Billing & Stripe Subscriptions** | ✅ Full | ❌ Read Only | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Manage Organizations & Branches** | ✅ Full | ✅ Full | ❌ Assigned Branch Only | ❌ Forbidden | ❌ Forbidden |
| **Invite & Remove Team Members** | ✅ Full | ✅ Full | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Configure Loyalty Rules & Promos** | ✅ Full | ✅ Full | ✅ Full | ❌ Read Only | ❌ Read Only |
| **Moderate Live Wall Memories** | ✅ Full | ✅ Full | ✅ Full | ✅ Approve/Hide | ❌ Forbidden |
| **Pair & Manage TV Screens** | ✅ Full | ✅ Full | ✅ Full | ❌ Read Only | ❌ Forbidden |
| **Scan & Log Visit Stamps** | ✅ Full | ✅ Full | ✅ Full | ✅ Verify | ✅ Own Visits |

---

## 3. Anti-Fraud & Visit Abuse Prevention

To prevent customers from spamming visits to unlock free rewards without purchasing coffee:

```mermaid
flowchart TD
    A[QR Scan Request] --> B{Check Device & IP Hash}
    B -->|Visit within past 60 mins?| C[Flag as Cooldown Conflict / Reject]
    B -->|No recent visit| D{Check Velocity / Geofence}
    D -->|Suspicious Burst (>5/hr)| E[Mark verification_status = 'suspicious']
    D -->|Normal Velocity| F[Mark verification_status = 'verified']
    F --> G[Atomic Loyalty Event + Stamp Increment]
```

1. **60-Minute Device Cooldown:** A customer device cannot earn more than one loyalty visit per branch within a 60-minute window.
2. **Velocity Spike Detection:** If more than 5 visits originate from the same IP hash within 10 minutes, subsequent visits are flagged as `suspicious` and held for merchant manual review.
3. **Dynamic QR Rolling:** Table QR codes embed signed tokens that can optionally rotate periodically, preventing guests from bookmarking QR URLs to scan remotely from home.

---

## 4. Media Sanitization & Upload Security

1. **Magic Bytes Verification:** Upload route checks the first 4–8 bytes of incoming binary payloads to confirm true image headers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` for WebP), rejecting spoofed executables or HTML polyglots.
2. **EXIF Stripping:** All uploaded photos are processed via Sharp to strip EXIF metadata, removing GPS latitude/longitude, timestamp details, and camera serial numbers before public storage.
3. **Signed Ephemeral URLs:** Admin downloads and high-resolution originals are accessed via short-lived signed URLs (15-minute expiry).

---

## 5. Network Hardening & HTTP Security Headers

Every HTTP response from the Next.js edge gateway includes the following headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```
