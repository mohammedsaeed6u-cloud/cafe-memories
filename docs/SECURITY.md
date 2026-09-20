# Security Architecture — Café Memories

## Overview
This document outlines the security architecture and practices for the Café Memories SaaS platform.

## Authentication

### Merchant Authentication
- **Provider**: Supabase Auth with Google OAuth
- **Flow**: Google Sign-in → Supabase session → JWT token
- **Session**: HTTP-only secure cookies managed by `@supabase/ssr`

### Customer Authentication
- **Guest First**: Customers start as anonymous users
- **Optional Auth**: Google sign-in to persist identity across devices
- **Identity Merge**: Anonymous history is merged into authenticated profile
- **No Passwords**: No email/password registration in MVP

## Authorization

### RBAC (Role-Based Access Control)
| Role | Scope | Permissions |
|------|-------|------------|
| Owner | Organization | Full access, billing, delete org |
| Admin | Organization | Manage staff, branding, rewards, moderation |
| Manager | Branch | Moderate content, view analytics, manage screens |
| Staff | Branch | Verify visits, basic moderation |

### Enforcement Layers
1. **Database (RLS)**: PostgreSQL Row Level Security policies
2. **Server Actions**: Role verification before mutations
3. **Middleware**: Route protection based on auth state
4. **UI**: Conditional rendering (cosmetic only, never sole protection)

## Multi-Tenancy Isolation
- Every tenant-owned table has `organization_id` column
- RLS policies enforce tenant isolation at the database level
- `organization_id` is **never** trusted from client input
- Derived from authenticated session server-side

## Data Security

### Image Upload
- MIME type validation (jpeg, png, webp, heic only)
- File size limit: 10MB
- Dimension limit: 4096x4096
- Magic byte verification where possible
- Metadata stripping (EXIF removal)
- Thumbnail generation server-side

### Storage
- Supabase Storage with bucket-level policies
- Signed URLs for private content (1-hour expiry)
- Public URLs only for approved Live Wall content
- Path structure: `org_id/branch_id/memory_id/`

### QR Codes
- QR URLs do not grant rewards directly
- Server validates visit legitimacy
- QR contains: org slug, branch slug, source identifier
- No sensitive data in QR URLs

## Anti-Fraud

### Visit Verification (MVP)
- **Rate Limiting**: Max 1 visit per customer per branch per 30 minutes
- **Session Fingerprint**: Browser fingerprint stored with visit
- **IP Hashing**: Hashed IP for suspicious pattern detection
- **Cooldown Enforcement**: Server-side time-window check
- **Suspicious Logging**: Flag and log abnormal patterns

### Reward Protection
- **Immutable Ledger**: All reward events recorded immutably
- **Idempotency Keys**: Prevent double-counting
- **Server-Side Calculation**: Never trust client-reported progress

## Privacy & Consent

### Consent Architecture
- Consent is a **first-class database entity** (not a boolean flag)
- Separate consent for: save, social share, Live Wall, marketing
- Consent version tracking for regulatory compliance
- Revocation triggers immediate removal from Live Wall

### Data Deletion
- Customer can request deletion of all memories
- Soft delete → remove from Live Wall → invalidate URLs → scheduled storage cleanup
- Audit trail maintained for compliance

### Data Minimization
- No unnecessary personal data collection
- Anonymous customers have minimal footprint
- Hashed IPs (not raw IPs) for analytics

## Infrastructure Security
- Environment variables for all secrets
- Service role key never exposed to browser
- CSRF protection via Supabase Auth
- Secure HTTP-only cookies for sessions
- Content Security Policy headers
- Rate limiting on API endpoints

## Audit Logging
All sensitive actions are logged:
- Authentication events
- Role changes
- Reward mutations
- Consent changes
- Moderation actions
- Screen pairing/unpairing
- Admin overrides
