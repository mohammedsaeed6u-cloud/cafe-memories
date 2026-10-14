# Café Memories — contributor notes

This is a Next.js 16 / React 19 / Supabase application. Read the relevant local Next.js guide in `node_modules/next/dist/docs/` before changing App Router APIs; Next 16 differs from older versions.

- Read `README.md` and `docs/ARCHITECTURE.md` for current behavior. Historical plans and the dated architecture review are not implementation contracts.
- Do not reintroduce browser-local merchant accounts, plaintext passwords, PIN-based authorization, fake Wallet passes, or sample visits/memories. Supabase Auth and PostgreSQL are the sole authority for accounts and business data.
- Enforce user/tenant/branch access at the API and database boundary. The service-role key must remain server-only; clients cannot determine their own organization or elevate privileges.
- Migrations are append-only after deployment. Generate `src/types/database.ts` with `corepack pnpm db:types` after editing SQL, and test RLS/RPCs with PGlite. A live Supabase staging check remains required before deploying.
- Keep screens honest about loading, empty, error, and configuration states; never substitute demo data on a failed request. Private media requires per-request authorization.
- Run `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build` before review.
