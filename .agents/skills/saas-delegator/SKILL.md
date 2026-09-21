---
name: saas-delegator
description: Master delegation and orchestration skill for building, architecting, reviewing, and shipping production-grade SaaS platforms capable of scaling to 1M, 10M, and 100M users. Dispatches specialized sub-roles across multi-tenancy, Stripe billing, auth/RBAC, Next.js architecture, UI/UX design (shadcn/ui-ux-pro-max), high-scale caching/queuing, and quality gates (clean-code-guard, test-guard, debate-review).
---

# SaaS Master Delegator & 100M-Scale Orchestrator (إدارة وتفويض أثقل مشاريع الـ SaaS الضخمة)

Use this skill to orchestrate end-to-end SaaS development engineered from day one to handle **1M to 100M users** with sub-100ms response times and zero single-points-of-failure.

---

## The 7 SaaS Delegation Roles

```
                      ┌────────────────────────┐
                      │    saas-delegator      │
                      │  (Master Orchestrator) │
                      └───────────┬────────────┘
                                  │
      ┌───────────────┬───────────┼───────────┬───────────────┬───────────────┐
      ▼               ▼           ▼           ▼               ▼               ▼
┌───────────┐   ┌───────────┐┌─────────┐┌───────────┐   ┌───────────┐   ┌───────────┐
│ Database  │   │ Auth &    ││ Billing ││ UI/UX     │   │ 100M Scale│   │ Quality   │
│ Architect │   │ Security  ││ (Stripe)││ Designer  │   │ & Caching │   │ & Guards  │
└───────────┘   └───────────┘└─────────┘└───────────┘   └───────────┘   └───────────┘
```

### Role 1: Database & Tenancy Architect
- **Mission:** Guarantee complete tenant data isolation, sub-millisecond index hits, and zero cross-tenant data leaks.
- **Directives:**
  1. Enable Row Level Security (RLS) on all public tables with indexed `tenant_id`.
  2. Implement composite indexes following the **ESR Rule** (Equality, Sort, Range).
  3. Enforce cursor-based pagination (`WHERE id > last_id LIMIT 20`). **NEVER use `OFFSET`** on large tables.
  4. Write idempotent migrations and maintain soft deletes (`deleted_at`).

### Role 2: Auth & Access Controller (RBAC)
- **Mission:** Enforce zero-trust authentication and granular role-based access.
- **Directives:**
  1. Define explicit role matrix: `Owner`, `Admin`, `Member`, `Viewer`.
  2. Validate sessions on the server in Server Components and API middleware.
  3. Never store JWTs or credentials in `localStorage`; enforce HTTP-only, secure cookies.
  4. Protect mutation endpoints with input validation via Zod schemas.

### Role 3: Billing & Subscription Specialist (Stripe)
- **Mission:** Build rock-solid subscription billing with zero revenue leakage.
- **Directives:**
  1. Verify webhook signatures using the raw request body.
  2. Implement webhook idempotency using a `processed_events` table.
  3. Model subscriptions as a state machine: `trialing` -> `active` -> `past_due` -> `canceled`.
  4. Provide Stripe Customer Portal integration for self-service cancellation and card updates.

### Role 4: Modern UI/UX Designer
- **Mission:** Deliver pixel-perfect, accessible, and high-conversion interfaces.
- **Directives:**
  1. Invoke `$ui-ux-pro-max` for design system palettes, typography scale, and layout styles (Bento Grid, SaaS Modern).
  2. Invoke `$shadcn-ui` for unstyled, accessible Radix primitives and slot composition (`asChild`).
  3. Implement the mandatory 4-state lifecycle: Loading (Skeleton), Loaded, Empty (with CTA), Error (with retry).
  4. Enforce mobile-first responsiveness and minimum touch targets (`44x44px`).

### Role 5: 100M-Scale & Resilience Architect (NEW)
- **Mission:** Ensure the platform withstands massive traffic surges (1M -> 100M users) without latency spikes or downtime.
- **Directives:**
  1. **Multi-Tier Caching:** L1 (CDN Edge with stale-while-revalidate), L2 (Redis with jittered TTL to prevent stampedes), L3 (Application LRU).
  2. **Background Queues:** Offload ALL heavy operations (emails, invoices, AI processing, data sync) to async queues (QStash, BullMQ, Cloudflare Queues). Handlers return `202 Accepted` in `< 50ms`.
  3. **Connection Pooling:** Connect to databases exclusively via connection poolers (PgBouncer, Supabase Pooler port 6543, Prisma Accelerate).
  4. **Traffic Defense:** Enforce sliding-window rate limiting via Redis (60 req/min for public, 600 req/min for auth).
  5. **Circuit Breakers:** Wrap external calls (Stripe, OpenAI, Supabase) in circuit breakers with graceful fallbacks.
  6. **100% Stateless:** No local file storage (use Cloudflare R2 / S3), no sticky sessions.

### Role 6: Quality & Code Guards (Automated Review)
- **Mission:** Prevent LLM failure modes, code rot, and regressions.
- **Directives:**
  1. Invoke `$clean-code-guard` on every generated diff (catches swallowed exceptions, hallucinated APIs, DRY/KISS violations).
  2. Invoke `$test-guard` on test suites (eliminates mock abuse, tests real business logic).
  3. Invoke `$docs-guard` on READMEs, API docs, and environment instructions.
  4. Invoke `$ui-review-loop` to record browser evidence and DOM timelines.

### Role 7: PR Reviewer & Deployer
- **Mission:** Autonomous double-check and production release.
- **Directives:**
  1. Invoke `$debate-review` for two-model debate reviews of PRs.
  2. Invoke `$babysit-pr` to resolve feedback and push verified fixes.
  3. Deploy to production via Vercel CLI (`vercel --prod`) or Cloudflare (`wrangler deploy`).

---

## Execution Workflow

When building or scaling any SaaS feature:
1. **Scale & Tenancy Design:** Role 1 & Role 5 define schema, RLS, indexes, and caching tiers.
2. **Security & Auth:** Role 2 creates permissions, rate limiters, and route guards.
3. **Billing Integration:** Role 3 attaches Stripe checkout or webhook listener.
4. **UI Construction:** Role 4 generates components using shadcn/ui and ui-ux-pro-max tokens.
5. **Guard Verification:** Role 6 runs `clean-code-guard` and `test-guard`.
6. **Delivery & Release:** Role 7 validates the build, runs typecheck, and executes deployment.
