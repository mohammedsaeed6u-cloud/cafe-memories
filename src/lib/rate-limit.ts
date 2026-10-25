/**
 * Distributed rate limiting.
 *
 * Production uses the `consume_rate_limit` SQL function so every Worker
 * isolate shares one sliding window. When the database is not configured
 * (local development, unit tests) an in-memory bucket keeps the same
 * semantics. A database error degrades to the local bucket instead of
 * failing the request — availability over strictness for a protection layer.
 */

import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_LOCAL_BUCKETS = 5_000;
const localBuckets = new Map<string, Bucket>();

function pruneLocalBuckets(now: number): void {
  if (localBuckets.size < MAX_LOCAL_BUCKETS) return;
  for (const [key, bucket] of localBuckets) {
    if (bucket.resetAt <= now) localBuckets.delete(key);
  }
  // Still full of live buckets: drop the oldest insertions.
  while (localBuckets.size >= MAX_LOCAL_BUCKETS) {
    const oldest = localBuckets.keys().next().value;
    if (oldest === undefined) break;
    localBuckets.delete(oldest);
  }
}

function consumeLocal(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = localBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    pruneLocalBuckets(now);
    const resetAt = now + windowSeconds * 1000;
    localBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

function databaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function parseRpcResult(data: unknown, limit: number, fallbackResetAt: number): RateLimitResult | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  if (typeof record.allowed !== 'boolean') return null;
  const resetAt = typeof record.reset_at === 'string' ? Date.parse(record.reset_at) : NaN;
  return {
    allowed: record.allowed,
    limit: typeof record.limit === 'number' ? record.limit : limit,
    remaining: typeof record.remaining === 'number' ? record.remaining : 0,
    resetAt: Number.isFinite(resetAt) ? resetAt : fallbackResetAt,
  };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const fallbackResetAt = Date.now() + windowSeconds * 1000;
  if (!databaseConfigured()) return consumeLocal(key, limit, windowSeconds);

  try {
    const { data, error } = await createAdminClient().rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return consumeLocal(key, limit, windowSeconds);
    return parseRpcResult(data, limit, fallbackResetAt) ?? consumeLocal(key, limit, windowSeconds);
  } catch {
    return consumeLocal(key, limit, windowSeconds);
  }
}

/** Cloudflare overwrites `cf-connecting-ip`; proxies append to `x-forwarded-for`. */
export function clientIp(request: NextRequest): string {
  const direct = request.headers.get('cf-connecting-ip');
  if (direct) return direct.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function rateLimitKey(request: NextRequest, scope: string, discriminator?: string): string {
  return `${scope}:${discriminator ?? clientIp(request)}`;
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: 'Too many requests', retryAfter }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
    },
  });
}
