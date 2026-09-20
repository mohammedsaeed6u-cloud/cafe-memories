# SaaS Production & Architecture Rules (قواعد بناء وتطوير منصات الـ SaaS)

## 1. Multi-Tenancy & Data Isolation
- **Tenant Scoping:** Every database query affecting user or organization data MUST explicitly include `tenant_id` / `org_id` in the WHERE clause, or utilize database-level Row Level Security (RLS) via Supabase/PostgreSQL.
- **Tenant Context:** Never trust a `tenant_id` provided directly in request bodies. Derive the active tenant exclusively from the verified server-side session or auth token.
- **Soft Deletes:** Implement `deleted_at` timestamps for critical business entities (users, teams, subscriptions, workspaces). Never hard-delete subscription or transaction history.

## 2. Authentication & Authorization (RBAC)
- **Role-Based Access Control:** Differentiate strictly between `Owner`, `Admin`, `Member`, and `Viewer`. Check permissions at both the UI layer (conditional rendering) and the backend API / Server Action layer.
- **Session Verification:** Verify sessions on every server-rendered page and API route. Use secure HTTP-only cookies; never store JWTs or sensitive tokens in `localStorage`.
- **Public vs. Protected Routes:** Default all new routes to protected unless explicitly marked as public (marketing, auth callbacks, webhook endpoints).

## 3. Billing & Payments (Stripe / LemonSqueezy)
- **Webhook Idempotency:** Webhook handlers MUST be idempotent. Store processed event IDs in an `events_processed` table and check before executing side effects (e.g. provisioning access).
- **Verify Webhook Signatures:** Never process a webhook without validating its raw request body signature (`stripe.webhooks.constructEvent`).
- **Billing State Machine:** Model subscriptions strictly: `trialing` -> `active` -> `past_due` -> `canceled` -> `unpaid`. Grace periods must be handled explicitly without immediately revoking user access on temporary card declines.
- **Customer Portal:** Leverage Stripe Customer Portal or equivalent for customer self-service (updating payment methods, viewing invoices, cancellation).

## 4. Next.js & Full-Stack Architecture
- **Server Actions & Mutations:** Always validate inputs using a schema validator (Zod / Valibot) before executing mutations. Return structured `{ success: boolean, data?: T, error?: string }` objects instead of throwing uncaught exceptions.
- **Data Fetching:** Fetch data on the server in React Server Components (RSC) to minimize client-side bundle size and eliminate waterfall network requests.
- **Optimistic Updates:** Implement optimistic UI updates with rollback capabilities on failure for high-frequency user actions (e.g., toggles, comments, reordering).
- **Database Connection Pooling:** Always use connection pooling (e.g., PgBouncer, Supabase Pooler on port 6543, or Prisma Accelerate) for serverless and edge functions.

## 5. Security & Observability
- **Rate Limiting:** Protect all public endpoints, auth routes, and AI generation routes with IP / user rate limiting (Upstash Redis / Cloudflare Turnstile).
- **Environment Variables:** Strictly separate client-safe variables (`NEXT_PUBLIC_`) from server-only secrets. Never commit `.env` files.
- **Error Tracking & Audit Logs:** Log all administrative actions (role changes, deletions, plan changes) to an audit log table. Connect production error monitoring (Sentry / LogRocket).
