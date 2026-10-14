# SaaS & Cloud Architecture Rules (cafe-memories)

## Tenant isolation
- Every merchant-owned row carries `organization_id`; branch scoping uses
  the exact slug branch with the primary-branch fallback
  (`resolveBranchAllowlist`). Never query business data without both scopes.

## AuthZ layers
- Staff Quick PIN protects merchant mutations (`verifyPinOnly` in
  card-config POST). Public endpoints validate input with Zod safeParse and
  return 400 with a machine-readable error string.
- Card size is merchant-authoritative: `reward_rules.threshold` (3–12),
  never a client-supplied number.

## Billing/webhooks (when added)
- Webhook handlers must be idempotent: store provider event ids and short-
  circuit duplicates before touching state.

## Error contract
- `{"ok": false, "error": "<machine_code>", "details": "<short>"}`
  with the most specific 4xx/5xx. Handlers catch, log scope, and answer
  JSON — never leak stack traces to clients.

## Pass/external-service operations
- Third-party signing (walletwallet.dev) is behind
  `NEXT_PUBLIC_WALLETWALLET_ENABLED` + `WALLETWALLET_API_KEY`; absence must
  degrade UX honestly (503 + guidance), never ship a broken artifact.
