# Café Memories / Stampy

The digital memory & loyalty layer for cafés: a guest photobooth, a live wall,
a staff terminal, a merchant dashboard, and a Super Admin portal — plus NFC
tap-to-stamp loyalty, a multi-tier reward ladder, Apple/Google Wallet passes,
wallet nudges, and a public venue directory. Backed by Supabase and deployed to
**Cloudflare Workers** with OpenNext.

## Stack

- **Runtime:** Cloudflare Workers (Node.js compatibility) via `@opennextjs/cloudflare`
- **Framework:** Next.js 16 (App Router, route handlers)
- **Database / Auth / Storage:** Supabase (Postgres + RLS, Auth, private buckets)
- **UI:** Tailwind CSS v4, Radix/shadcn-style primitives, Lucide icons
- **Validation:** Zod 4
- **Tests:** Vitest + Testing Library (jsdom)
- **Language:** TypeScript (strict)

## Prerequisites

- Node.js 20+
- pnpm 12+
- A Supabase project
- A Cloudflare account with Workers enabled
- A WalletWallet API key for Apple/Google wallet passes (optional but required
  for the wallet feature)

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev
```

The app runs at <http://localhost:3000>.

### Database

Apply the SQL migrations in `supabase/migrations` **in order** (00001 → 00015)
through the Supabase SQL editor, or link the project and push:

```bash
pnpm dlx supabase link --project-ref <project-ref>
pnpm db:push
```

The last three migrations carry the behaviour the current code depends on:

- `00013_production_hardening.sql` — staff PIN credentials, print jobs, paired
  screens, QR scans, rate limiting, verified visits, keepsake cards.
- `00014_stamp_ledger_and_promotions.sql` — the stamp ledger (the loyalty
  currency), reward-ladder tiers, stamp promotions, vouchers and the rewritten
  visit/balance RPCs.
- `00015_nfc_taps_and_discovery.sql` — NFC readers and tap events, tap-to-redeem,
  merchant insights, wallet-nudge audiences, and the public venue directory.

Do not skip any of them; the API calls RPCs that only exist after they run.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production Next.js build |
| `pnpm build:cf` | Full OpenNext build for Workers (`.open-next/worker.js` + assets) |
| `pnpm preview` | Build and run the Worker locally in workerd |
| `pnpm deploy:cf` | Build and deploy to Cloudflare |
| `pnpm start` | Serve the Node build (not the Worker target) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (single run) |
| `pnpm db:push` | Push Supabase migrations |

## Deploying to Cloudflare Workers

1. **Create the Worker secrets** (never commit them):

   ```bash
   pnpm wrangler secret put NEXT_PUBLIC_SUPABASE_URL
   pnpm wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
   pnpm wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put STAFF_SESSION_SECRET
   pnpm wrangler secret put CUSTOMER_SESSION_SECRET
   pnpm wrangler secret put ANTI_FRAUD_SALT
   pnpm wrangler secret put WALLETWALLET_API_KEY
   pnpm wrangler secret put SUPER_ADMIN_EMAILS
   pnpm wrangler secret put NEXT_PUBLIC_SITE_URL
   ```

   `NEXT_PUBLIC_*` values are inlined at build time, so they must also be
   present in the build environment (e.g. CI variables or `.env.production`).

2. **Apply the migrations** to the production Supabase project.

3. **Deploy**:

   ```bash
   pnpm deploy:cf
   ```

   The build writes `.open-next/worker.js` and `.open-next/assets`, which
   `wrangler.jsonc` binds as `env.ASSETS`.

4. **Verify**:

   ```bash
   pnpm wrangler deploy --dry-run   # validates the bundle without uploading
   ```

### Windows note

OpenNext warns that Windows is not fully supported. This repo ships a pnpm
patch (`patches/@opennextjs__aws@4.1.4.patch`) that materialises symlinks when
the process lacks `SeCreateSymbolicLinkPrivilege`, so the build works without
Developer Mode. Linux CI does not need it. For the most predictable results,
build on Linux or WSL.

## Security model (summary)

- **Merchant/staff auth:** Supabase Auth for merchants; staff sign in with a
  staff code + PIN verified server-side (PBKDF2-SHA256, 120k iterations) and
  receive an HMAC-signed, HttpOnly session cookie.
- **Guest identity:** a signed `stampy_customer_session` cookie. Phone numbers
  are contact data, never an identity key.
- **NFC tags:** a passive tag carries a bearer secret in the URL fragment, so it
  never reaches request logs. The database stores only SHA-256 of the secret;
  rotating a reader invalidates every printed tag instantly. Taps require the
  signed customer session, a per-customer/branch cooldown, and velocity limits.
- **Tenant isolation:** every server route resolves the operator from the
  session and scopes queries by `organization_id`; RLS is enabled in Postgres.
  Branch managers are additionally scoped to their own branch.
- **Uploads:** magic-byte validation, 10 MB cap, rate limiting, EXIF/XMP
  stripping, private buckets served through short-lived signed URLs.
- **Headers:** CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` are set in `next.config.ts` and
  `public/_headers`. Authorization is enforced in each server component and
  route handler (`src/lib/server/page-auth.ts`), not in middleware — Next 16
  middleware would force a second Node runtime into the Worker.
- **No demo data:** QR slugs, venue slugs, and wallet passes are resolved from
  the database; unknown codes fall back to `/c` instead of a fake venue.

## Project layout

```
src/app                 routes (marketing, auth, customer, merchant, admin, API)
src/components          UI by domain (customer, dashboard, wall, wallet, …)
src/lib/server          session → operator resolution, settings, signed URLs
src/lib/services        domain services (wallet, images, print, loyalty)
src/lib/supabase        browser/server/admin clients
supabase/migrations     ordered SQL migrations (RLS + RPCs)
tests/                  unit tests for security-critical code
patches/                pnpm patches for the Windows/OpenNext build
```
