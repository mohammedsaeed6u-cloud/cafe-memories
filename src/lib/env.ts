/**
 * Server environment access.
 *
 * The rule is simple: production never falls back to a secret that is written
 * in the repository. Development and tests may use a deterministic fallback so
 * that a fresh clone boots without ceremony, but `NODE_ENV=production` fails
 * loudly instead of silently signing sessions with a public string.
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Required in every environment. Throws with the variable name, never its value. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Optional value with a default; empty strings are treated as absent. */
export function optionalEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

/**
 * A secret used for signing or encryption.
 *
 * @param name        Environment variable that holds the real secret.
 * @param devFallback Deterministic value for development and tests only.
 * @param minLength   Minimum accepted length in production (default 32).
 */
export function secret(name: string, devFallback: string, minLength = 32): string {
  const value = process.env[name];
  if (value && value.length >= minLength) return value;
  if (isProduction()) {
    throw new Error(`${name} must be set to at least ${minLength} characters in production`);
  }
  return devFallback;
}

/** Comma-separated allow-list, normalised to lower-case. */
export function envList(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}
