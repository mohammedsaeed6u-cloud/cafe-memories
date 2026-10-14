/**
 * Shopify-Standard Leaky Bucket Rate Limiter
 * 
 * Prevents endpoint exhaustion, DDOS, and robotic stamp-stuffing attacks.
 * Replicates Shopify's standard 40-token bucket leaking at 2 tokens/sec.
 */

export interface BucketState {
  currentLevel: number;
  lastLeakTime: number;
}

export interface RateLimitConfig {
  capacity: number; // Max burst (default: 40)
  leakRatePerSec: number; // Leak rate (default: 2 per sec)
}

export interface RateLimitResult {
  allowed: boolean;
  currentLevel: number;
  maxCapacity: number;
  retryAfterSeconds: number;
  headerString: string; // e.g. "1/40"
}

const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 40,
  leakRatePerSec: 2,
};

const buckets = new Map<string, BucketState>();

export const RateLimiterService = {
  /**
   * Evaluates a request against the leaky bucket.
   * If allowed, adds 1 unit to the bucket.
   */
  consume(
    identifier: string,
    cost: number = 1,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): RateLimitResult {
    const now = Date.now();
    let state = buckets.get(identifier);

    if (!state) {
      state = {
        currentLevel: 0,
        lastLeakTime: now,
      };
      buckets.set(identifier, state);
    }

    // 1. Calculate how much has leaked since last request
    const elapsedSec = (now - state.lastLeakTime) / 1000;
    const leaked = elapsedSec * config.leakRatePerSec;
    state.currentLevel = Math.max(0, state.currentLevel - leaked);
    state.lastLeakTime = now;

    // 2. Check if adding 'cost' exceeds capacity
    if (state.currentLevel + cost > config.capacity) {
      const excess = state.currentLevel + cost - config.capacity;
      const retryAfterSeconds = Math.ceil(excess / config.leakRatePerSec);

      return {
        allowed: false,
        currentLevel: Math.round(state.currentLevel),
        maxCapacity: config.capacity,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
        headerString: `${Math.round(state.currentLevel)}/${config.capacity}`,
      };
    }

    // 3. Consume
    state.currentLevel += cost;
    const roundedLevel = Math.round(state.currentLevel);

    return {
      allowed: true,
      currentLevel: roundedLevel,
      maxCapacity: config.capacity,
      retryAfterSeconds: 0,
      headerString: `${roundedLevel}/${config.capacity}`,
    };
  },

  /**
   * Helper to format HTTP headers compliant with Shopify & IETF conventions
   */
  getHttpHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Stampy-Call-Limit': result.headerString,
      'X-RateLimit-Limit': String(result.maxCapacity),
      'X-RateLimit-Remaining': String(Math.max(0, result.maxCapacity - result.currentLevel)),
    };

    if (!result.allowed) {
      headers['Retry-After'] = String(result.retryAfterSeconds);
    }

    return headers;
  },

  /**
   * Reset store for unit tests
   */
  _resetForTesting(): void {
    buckets.clear();
  },
};
