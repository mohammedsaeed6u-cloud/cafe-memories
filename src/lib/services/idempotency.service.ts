/**
 * Shopify-Grade Idempotency Engine
 * 
 * Guarantees that mutating operations (tap, stamp, redeem, refund)
 * are executed strictly once, even when mobile networks retry or hardware
 * scanners double-fire.
 * 
 * Follows IETF draft-ietf-httpapi-idempotency-key-header & Shopify Standards.
 */

export interface IdempotencyRecord<T = unknown> {
  key: string;
  status: 'processing' | 'completed' | 'failed';
  statusCode: number;
  responseBody?: T;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOCK_TIMEOUT_MS = 15 * 1000; // 15 seconds lock before considering processing dead

const idempotencyStore = new Map<string, IdempotencyRecord<unknown>>();

export const IdempotencyService = {
  /**
   * Scopes a raw key to a specific brand/tenant
   */
  buildScopedKey(brandId: string, rawKey: string): string {
    return `${brandId}:${rawKey.trim()}`;
  },

  /**
   * Checks if an operation is already completed or in-flight.
   */
  getRecord<T>(scopedKey: string): IdempotencyRecord<T> | null {
    const record = idempotencyStore.get(scopedKey) as IdempotencyRecord<T> | undefined;
    if (!record) return null;

    // Prune expired records
    if (Date.now() > record.expiresAt) {
      idempotencyStore.delete(scopedKey);
      return null;
    }

    return record;
  },

  /**
   * Atomically acquires a lock on the key.
   * Returns false if key is currently being processed by another concurrent request.
   */
  acquireLock(scopedKey: string, ttlMs: number = DEFAULT_TTL_MS): { acquired: boolean; existingRecord?: IdempotencyRecord } {
    const existing = this.getRecord(scopedKey);
    const now = Date.now();

    if (existing) {
      if (existing.status === 'processing') {
        // Check if the lock timed out (e.g. server crash during processing)
        if (now - existing.createdAt < LOCK_TIMEOUT_MS) {
          return { acquired: false, existingRecord: existing };
        }
      } else {
        // Already completed or failed
        return { acquired: false, existingRecord: existing };
      }
    }

    // Acquire lock
    idempotencyStore.set(scopedKey, {
      key: scopedKey,
      status: 'processing',
      statusCode: 202,
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return { acquired: true };
  },

  /**
   * Commits the completed response into the idempotency store.
   */
  commitResult<T>(scopedKey: string, statusCode: number, responseBody: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const now = Date.now();
    idempotencyStore.set(scopedKey, {
      key: scopedKey,
      status: 'completed',
      statusCode,
      responseBody,
      createdAt: now,
      expiresAt: now + ttlMs,
    });
  },

  /**
   * Marks key as failed, releasing the lock so future valid attempts can retry.
   */
  releaseOrAbort(scopedKey: string): void {
    idempotencyStore.delete(scopedKey);
  },

  /**
   * High-level wrapper executing a block idempotently.
   */
  async executeIdempotent<T>(
    scopedKey: string,
    operation: () => Promise<{ status: number; body: T }>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<{ isCached: boolean; status: number; body: T; conflict?: boolean }> {
    const lock = this.acquireLock(scopedKey, ttlMs);

    if (!lock.acquired) {
      if (lock.existingRecord?.status === 'processing') {
        return {
          isCached: false,
          conflict: true,
          status: 409,
          body: { error: 'Concurrent request in progress for this idempotency key' } as unknown as T,
        };
      }
      if (lock.existingRecord?.status === 'completed') {
        return {
          isCached: true,
          status: lock.existingRecord.statusCode,
          body: lock.existingRecord.responseBody as T,
        };
      }
    }

    try {
      const result = await operation();
      this.commitResult(scopedKey, result.status, result.body, ttlMs);
      return {
        isCached: false,
        status: result.status,
        body: result.body,
      };
    } catch (err) {
      this.releaseOrAbort(scopedKey);
      throw err;
    }
  },

  /**
   * Reset store for unit tests
   */
  _resetForTesting(): void {
    idempotencyStore.clear();
  },
};
