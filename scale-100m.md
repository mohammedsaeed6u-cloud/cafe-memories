# 100M-Scale & High-Performance Architecture (cafe-memories)

Operational rules referenced by AGENTS.md. Every rule cites the code that
already implements it — extend the pattern, do not invent a second one.

## Multi-tier caching
- L1 per-process memory caches carry a TTL and a max size:
  `LOYALTY_STAMPS_CACHE_TTL_MS` / `LOYALTY_STAMPS_CACHE_MAX_ENTRIES`
  (src/lib/services/loyalty-stamps.ts), branches cache in the stamps route.
- Writers MUST invalidate explicitly after mutations
  (`invalidateLoyaltyStampsCache` after each capture) — TTL is a safety net,
  not the invalidation strategy.

## Request paths stay light
- No heavy work inline in route handlers: image optimization is Sharp in a
  background step, pass updates are fire-and-forget with the response
  already composed.
- Fan-out to external systems (WalletWallet PUT) is opportunistic: quiet
  no-op outcomes (`outsourcing_disabled`, `no_pass`, `unchanged`) return
  structured reasons; only true upstream failures throw/502.

## Database
- Read embedded children in ONE query via PostgREST embeds
  (customers → memories → branches) instead of sequential chains.
- Sort/cap small sets in memory (a card holds ≤ 12 stamps) instead of
  non-portable embedded ordering.
- Unique keys are the idempotency layer: `reward_events.idempotency_key`
  (`voucher:CODE` / `redeem:CODE`), Postgres 23505 → HTTP 409 at the edge.

## Identity and phone canon
- Every writer stores `canonicalizePhone(raw)`; every reader looks up via
  `phoneLookupVariants`. Never store a raw customer-typed phone.

## Statelessness
- Server code never keeps per-tenant state beyond small TTL caches.
- Customer-visible persistence is Supabase; device persistence is
  localStorage keys namespaced by slug/phone (customer-registry.service.ts).
