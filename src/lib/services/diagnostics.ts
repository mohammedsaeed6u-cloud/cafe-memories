/**
 * Structured diagnostics for intentionally-ignored failures.
 *
 * AGENTS.md forbids silent catch blocks ("Zero Silent Failures"): every
 * `catch {}` must at least record what broke and where, so debugging a
 * production issue never starts from a black hole.
 *
 * Client-safe by design: console-only, no payloads, no network calls.
 * Scope labels follow "<area>/<file>#<occurrence>" so a single log line
 * pinpoints the exact site in the source.
 */
export function reportIgnoredError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[ignored:${scope}]`, message);
}
