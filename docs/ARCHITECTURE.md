# Architecture — Café Memories

## System Overview

Café Memories is a multi-tenant SaaS platform that combines digital loyalty, customer photo memories, branded social sharing, and live café wall displays.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  📱 Customer  │  💻 Merchant  │  📺 Live Wall │  🔧 Admin     │
│  Mobile Web   │  Dashboard    │  TV Display   │  Dashboard    │
│  /c/[slug]    │  /dashboard/* │  /wall/[id]   │  /admin/*     │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Next.js App      │
                    │   (Vercel Edge)    │
                    │                    │
                    │  ┌──────────────┐  │
                    │  │Server Actions│  │
                    │  │Route Handlers│  │
                    │  │  Middleware   │  │
                    │  └──────┬───────┘  │
                    └─────────┼──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │  Supabase    │  │  Supabase   │  │  Supabase  │
    │  PostgreSQL  │  │  Storage    │  │  Realtime  │
    │  + Auth      │  │  (Images)   │  │  (Live     │
    │  + RLS       │  │             │  │   Wall)    │
    └──────────────┘  └─────────────┘  └────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI Library | Tailwind CSS + shadcn/ui | 4.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth + Google OAuth | - |
| Storage | Supabase Storage | - |
| Realtime | Supabase Realtime | - |
| Validation | Zod | 4.x |
| Image Processing | Sharp | 0.35.x |
| Hosting | Vercel | - |

## Multi-Tenancy Model

- **Tenant Key**: `organization_id` (UUID)
- **Isolation**: PostgreSQL Row Level Security (RLS)
- **Branch Scoping**: Branch-specific data additionally scoped by `branch_id`
- **Staff Scoping**: Staff members can be scoped to specific branches

## Data Flow: Core Loop

```
Customer scans QR
  → Resolves to /go/[qrSlug]
  → Server identifies org + branch + source
  → Redirects to /c/[cafeSlug]?branch=X&source=Y
  → Customer sees branded café page
  → Opens camera, takes photo
  → Uploads image (validated server-side)
  → Creates visit (anti-fraud checked)
  → Creates memory (pending moderation)
  → Shows journey progress
  → Merchant approves memory
  → Supabase Realtime → Live Wall receives update
  → Photo appears on screen
  → Other customers see it → scan QR → loop continues
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | SSR, Server Actions, single codebase for all user types |
| Supabase over custom backend | Auth + DB + Storage + Realtime in one platform, RLS for tenant isolation |
| Web-based (not native app) | Zero friction for customers (no app download), works on any phone |
| Anonymous-first identity | Reduces onboarding friction, optional auth later |
| Immutable reward ledger | Prevents fraud, enables audit trail |
| Consent as first-class entity | Legal compliance, proper privacy handling |
| Code-based screen pairing | No Google login needed on TV hardware |

## Folder Structure

See the project `src/` directory for the complete structure following Next.js App Router conventions with route groups for each user type.
