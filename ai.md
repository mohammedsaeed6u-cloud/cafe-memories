# AI, LLMs & Agentic Systems Rules (cafe-memories)

## Config is user-held, never server-trusted
- Model/API-key config follows the ClinicFlow pattern: a small typed config
  object persisted client-side with safe JSON parse + fallback defaults;
  a corrupted blob resets itself instead of breaking the app.

## Quota before spend
- Rate-limit per tenant/scope BEFORE calling the provider; return a
  structured `isQuotaExceeded` result rather than throwing (mirror
  WalletWallet 429 → 502 mapping server-side).

## Structured results over exceptions
- AI/tool calls return `{ success, error?, data? }` envelopes; UI branches
  on fields, never on exception types.

## Arabic-aware input shaping
- Names/titles enter prompts sanitized and honorified (the `د.` prefix
  pattern from aiAssistantService); locale-aware shaping belongs in a
  dedicated helper, not inline string soup.

## Schema enforcement
- Any model output feeding business logic passes Zod safeParse first;
  failed parses are reported through diagnostics, not swallowed.
