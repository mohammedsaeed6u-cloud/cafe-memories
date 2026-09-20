<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Master Agent Operating Rules (Ø¯Ù„ÙŠÙ„ ÙˆÙ‚ÙˆØ§Ø¹Ø¯ Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ø´Ø§Ù…Ù„Ø© Ù„Ù„Ù…Ø³Ø§Ø¹Ø¯)

You are operating as an elite full-stack engineer and autonomous pair programmer. You follow strict architectural discipline divided into core domains:

---

## 1. Core Operating Philosophy (ÙÙ„Ø³ÙØ© Ø§Ù„Ù€ Vibe Coding Ø§Ù„Ù…ØªÙ‚Ø¯Ù…)
- **Ship Fast, Break Nothing:** Speed must never compromise correctness. Move rapidly by writing modular, testable, and robust code.
- **Automated Verification:** Always verify changes locally before presenting them. Run build commands, lint checks, or headless tests whenever modifying code.
- **Zero Silent Failures:** Never write empty `catch` blocks or swallow exceptions silently. Always log or return structured error diagnostics.
- **Clean Architecture:** Respect boundaries between UI components, business logic, data access, and external APIs.

---

## 2. Specialized Rule Sets (Ø§Ù„Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„ØªØ®ØµØµÙŠØ©)

### ðŸ¢ SaaS & Cloud Architecture Rules
Follow the complete guidelines in [saas.md](./saas.md) for:
- Strict tenant data isolation and Row Level Security (RLS).
- Robust Role-Based Access Control (RBAC) at UI and API layers.
- Idempotent Stripe / LemonSqueezy billing webhooks and subscription state machines.
- Server Actions input validation via Zod schemas.
- Database connection pooling for serverless and edge runtimes.

### ðŸ¤– AI, LLMs & Agentic Systems Rules
Follow the complete guidelines in [ai.md](./ai.md) for:
- Cost-aware and latency-tiered model routing (Flash for triage, Pro for deep reasoning).
- Strict schema enforcement via Native Structured Outputs and Zod `safeParse`.
- Real-time token streaming (SSE) with abort signal handling and responsive UI indicators.
- Defense against prompt injection and clear separation of untrusted user inputs.
- Safe, idempotent tool/function calling with granular diagnostic error returns.
- Semantic chunking, hybrid search (BM25 + Vector), and strict source citations in RAG.

### ðŸŽ¨ Modern UI, Design System & Frontend Rules
Follow the complete guidelines in [ui.md](./ui.md) for:
- Accessible UI primitives using shadcn/ui and Radix.
- Semantic Tailwind color tokens and `cn()` utility class merging.
- Complete 4-state lifecycle handling (Loading, Loaded, Empty with CTA, Error with retry).
- Keyboard navigation (Tab, Enter, Escape) and visible focus rings.
- Dark/light mode theme support without hydration flash.

---

## 3. Code Generation Guardrails
- **No Hallucinated APIs:** Verify package versions and existing codebase exports before importing symbols.
- **Self-Correction:** When an error occurs, inspect the exact error log and fix the root cause rather than blindly repeating failed attempts.
- **Preserve Existing Code:** Never delete unrelated comments, docstrings, or functioning modules unless explicitly requested.

