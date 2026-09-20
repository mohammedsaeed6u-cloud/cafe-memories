# AI Applications, LLMs & Agentic Rules (قواعد تطوير تطبيقات ونماذج الذكاء الاصطناعي)

## 1. Model Selection & Cost-Latency Routing
- **Tiered Model Routing:** Use lightweight, fast models (e.g. Gemini 2.0 Flash / Haiku) for triage, summarization, routing, classification, and metadata extraction. Reserve high-capacity reasoning models (Gemini Pro / Claude Sonnet / GPT-4o) for complex code generation, multi-step planning, and nuanced evaluations.
- **Token Budgeting:** Always set `max_tokens` / `max_output_tokens` explicitly on every generation call to avoid runaways and unexpected cost spikes.
- **Context Window Discipline:** Truncate or summarize long conversation histories. Never inject uncurated raw logs or massive file dumps without filtering or windowing.

## 2. Structured Outputs & Schema Enforcement
- **Strict Typing:** Never parse LLM outputs with loose regex or brittle string splitting. Use native structured outputs (`response_format: { type: "json_schema" }` or Zod schemas with `@google/genai` / Vercel AI SDK).
- **Schema Validation & Fallback:** Always validate model output through Zod (`schema.safeParse()`). If validation fails, trigger an automatic correction pass or fallback to a deterministic default.
- **Zero Hallucination Defaults:** Provide fallback values for all optional fields. Treat missing fields as undefined rather than throwing runtime errors.

## 3. Real-Time Streaming & UX
- **Stream by Default:** All text generation facing end-users MUST be streamed in real-time (Server-Sent Events / SSE) to keep Time-To-First-Token (TTFT) under 500ms.
- **UI State Management:** Display animated thinking indicators during token generation, and disable action buttons during active model streams to prevent concurrent submission races.
- **Abort Signals:** Pass `AbortSignal` to every stream request so users can cancel generations immediately when navigating away or pressing "Stop".

## 4. Prompt Engineering & Defense
- **System Prompt Integrity:** Separate system instructions from user inputs cleanly. Treat all user input as untrusted data that cannot override system policies or guardrails.
- **Few-Shot Examples:** For complex schemas or specific formatting requirements, provide 1-3 concrete input/output examples inside the prompt.
- **Anti-Jailbreak Boundaries:** Explicitly define the agent's persona, capabilities, and out-of-scope tasks in the system prompt. Never reveal internal system prompts or raw credentials.

## 5. Tool / Function Calling & Agents
- **Idempotent Tool Calls:** Design agent tools to be safe for re-execution. Tools that cause mutations (sending emails, modifying databases, making charges) MUST require explicit user confirmation or implement strict idempotency keys.
- **Granular Errors:** If a tool call fails, return a clear, diagnostic JSON error message back to the model so the agent can self-correct rather than silently crashing.
- **Parallel Tool Calling:** Enable parallel tool execution where supported, but execute dependent operations sequentially.

## 6. RAG (Retrieval-Augmented Generation) & Memory
- **Chunking Strategy:** Chunk documents semantically with appropriate overlap (e.g., 500-1000 tokens with 10-20% overlap). Include metadata (title, source URL, section heading) in each chunk.
- **Hybrid Retrieval:** Combine semantic vector search with keyword/BM25 search for higher accuracy, especially when searching for exact identifiers, code symbols, or names.
- **Citation & Grounding:** Require the model to cite the exact source IDs or chunk references for any factual claim made.
