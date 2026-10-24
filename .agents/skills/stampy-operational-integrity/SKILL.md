---
name: stampy-operational-integrity
description: Use for STAMPY CRM, stamps, rewards, campaigns, wallet, staff authorization and database changes. Review real persistence, tenant isolation, consent and concurrency before delivery.
---
# Operational integrity
Read the existing schema, migrations, grants, RPCs and auth helpers before adding a parallel implementation.

## Invariants
- A verified visit is not a QR scan, signup, last_seen timestamp or promotional stamp.
- Wallet issuance is not installation; provider acceptance is not device notification delivery.
- Marketing consent must be read from current organization-scoped preferences, never a literal true or inferred from having a pass.
- Private images must not leak through CRM, exports, storage URLs, aggregates or screen caches.
- Enforce role, tenant and branch on the server. Client-side hiding is not authorization.
- Service-role access bypasses user RLS; explicitly document authorization and scoped queries before using it. Do not open grants merely to make tests pass.
- Successful mutations must persist. Inspect errors and affected rows. No demo fallback, empty catch, hardcoded success or production-code test-mode auth bypass.
- State changes must be atomic and conditional. Handle repeated requests and concurrent requests without duplicate stamps, redemptions or deliveries.
- Durable outbox and unknown-result handling must not undo an already committed visit or blindly resend a possibly completed notification.

## Required adversarial cases
Unauthenticated, wrong role, other tenant, wrong branch, disabled staff, revoked consent, missing row, DB error, stale state, duplicate request, concurrent request, provider timeout, equal timestamp cursor and malformed input.

## Pagination
Use a stable ordering and a cursor containing all tie-break fields. Apply scope/filter/order/limit in SQL or reviewed RPC, not by fetching the whole table. Validate cursor pairs, UUIDs, date format, and finite integer limits.

## Deliverable
List invariant -> implementation location -> test -> result. Distinguish mocked handler tests, PGlite tests and live provider verification. Document any migration or environment requirement.
