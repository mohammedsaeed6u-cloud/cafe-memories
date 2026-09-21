---
name: core-delegator
description: Master delegation and orchestration skill for building, benchmarking, and shipping complex Non-SaaS systems capable of serving 1M to 100M requests (AI Agents, LLM RAG pipelines, high-throughput APIs, CLI utilities, automation bots, and system tools). Coordinates model routing, streaming protocols, systems programming, automated verification, high-scale concurrency, and multi-agent relays.
---

# Core & AI Master Delegator (إدارة وتفويض أثقل مشاريع الـ Non-SaaS والـ AI على نطاق 100M)

Use this skill when building complex software systems that are NOT standard SaaS applications: AI Agents, autonomous pipelines, RAG search engines, high-speed APIs, CLI developer tools, desktop utilities, or data engineering workflows engineered to handle massive workloads.

---

## The 7 Core Delegation Roles

```
                      ┌────────────────────────┐
                      │     core-delegator     │
                      │  (Master Orchestrator) │
                      └───────────┬────────────┘
                                  │
      ┌───────────────┬───────────┼───────────┬───────────────┬───────────────┐
      ▼               ▼           ▼           ▼               ▼               ▼
┌───────────┐   ┌───────────┐┌─────────┐┌───────────┐   ┌───────────┐   ┌───────────┐
│ Systems   │   │ AI & LLM  ││ Data &  ││ Engine &  │   │ 100M Scale│   │ Quality   │
│ Architect │   │ Engineer  ││ Memory  ││ Protocols │   │ & Concurr.│   │ & Guards  │
└───────────┘   └───────────┘└─────────┘└───────────┘   └───────────┘   └───────────┘
```

### Role 1: Systems Architect & Runtime Specialist
- **Mission:** Select the optimal runtime, concurrency model, and architectural boundaries for peak performance.
- **Directives:**
  1. Leverage blazing-fast modern runtimes: **Bun** for instant TypeScript/JavaScript execution, **uv** for ultra-fast Python pipelines, or compiled languages (Rust/Go) where raw throughput is required.
  2. Implement clean architecture: Decouple domain logic from IO, network transports, and third-party SDKs.
  3. Ensure cross-platform portability (Windows, macOS, Linux) with path normalization and POSIX/PowerShell compatibility.

### Role 2: AI, LLM & Agentic Engineer
- **Mission:** Architect cost-effective, deterministic, and autonomous agent loops.
- **Directives:**
  1. **Tiered Routing:** Route classification and summarization to fast models (Flash/Haiku); reserve deep reasoning models (Pro/Sonnet) for code generation and multi-step synthesis.
  2. **Structured Outputs:** Enforce strict schemas via native JSON Schema or Zod / Pydantic with `.safeParse()`.
  3. **Streaming & Abort:** Stream output tokens via SSE or WebSockets with full `AbortSignal` handling.
  4. **Tool Calling Safety:** Implement idempotency on mutating tools, and return structured diagnostic JSON on failures to enable LLM self-healing.

### Role 3: Data, Memory & Vector Engineer
- **Mission:** High-speed retrieval, indexing, and persistent memory.
- **Directives:**
  1. **Semantic Chunking:** Chunk documents with 10-20% overlap (500-1000 tokens) preserving document metadata.
  2. **Hybrid Search:** Combine dense vector embeddings with sparse keyword search (BM25) for high-precision recall.
  3. **Local & Embedded Storage:** Utilize embedded databases (DuckDB, SQLite, LibSQL, LanceDB) for low-latency local queries without external network hops.
  4. **Token Cache:** Cache embedding queries and prompt prefixes to minimize API costs and latency.

### Role 4: Protocols & System Interfaces
- **Mission:** Fast inter-process communication, real-time networking, and hardware/browser control.
- **Directives:**
  1. **Browser Control:** Automate Chrome via Chrome DevTools Protocol (CDP on port 9222) or `agent-browser` for headless testing and data extraction.
  2. **High-Speed APIs:** Implement low-latency endpoints using Hono, FastAPI, or tRPC with sub-50ms response budgets.
  3. **Terminal Interfaces:** Build rich, interactive terminal experiences using Rich / Textual (Python) or Ink / Chalk (Node/Bun).

### Role 5: 100M Scale & High-Concurrency Specialist (NEW)
- **Mission:** Eliminate memory leaks, CPU bottlenecks, and network latency at scale.
- **Directives:**
  1. **Backpressure & Batching:** Implement streaming backpressure and dynamic batching for AI inference and vector indexing.
  2. **Zero-Copy & Memory Limits:** Use zero-copy streams and strictly bound in-memory buffers to prevent OOM errors.
  3. **Embedding Quantization:** Use binary or scalar quantization (int8) for vector embeddings to reduce RAM footprint by 75% while retaining 98% accuracy.
  4. **Distributed Worker Queues:** Offload processing to asynchronous workers with exponential backoff and dead-letter queues.

### Role 6: Quality & Code Guards (Automated Review)
- **Mission:** Eliminate regressions, mock abuse, and hallucinated code.
- **Directives:**
  1. Invoke `$clean-code-guard` to verify clean code, SOLID, and catch silent error swallowing.
  2. Invoke `$test-guard` to enforce strict assertion boundaries and eliminate tautological tests.
  3. Invoke `$docs-guard` to verify CLI command signatures, help flags, and example code.

### Role 7: Multi-Agent Relay & Autonomous Review
- **Mission:** Distribute sub-tasks across specialized agent lanes.
- **Directives:**
  1. Use `$delegate-setup` to create specialized lanes (e.g. `claude-delegate`, `codex-delegate`, `agy-delegate`).
  2. Invoke `$debate-review` for critical algorithmic and security reviews before landing code.
  3. Run continuous regression benchmarks.

---

## Execution Workflow

When tasked with a Non-SaaS or AI system, execute in sequence:
1. **Architecture & Runtime:** Role 1 & Role 5 define directory layout, package manager (Bun/uv), and concurrency bounds.
2. **AI & Core Logic:** Role 2 implements LLM prompts, structured schemas, or algorithmic engines.
3. **Data & Caching:** Role 3 attaches local storage, vector indexes, or memory caches.
4. **Interface / Protocol:** Role 4 exposes CLI flags, WebSocket streams, or REST routes.
5. **Quality Verification:** Role 6 executes `clean-code-guard`, unit tests, and performance benchmarks.
6. **Relay & Delivery:** Role 7 runs debate reviews and bundles the executable or package.
