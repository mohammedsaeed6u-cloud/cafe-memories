/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/visits/route';

/**
 * MOCKED ROUTE HANDLER INTEGRATION SUITE (Local Contract Verification)
 * 
 * Tests the Next.js API route handler (POST /api/v1/visits) in Vitest using mocked Supabase dependencies:
 * 1. Unauthenticated request rejection (401 Unauthorized).
 * 2. Unauthorized role rejection (403 Forbidden).
 * 3. Fresh visit recording contract and atomic replay handling (200 OK with replayed: true).
 * 4. Idempotency key conflict mapping (409 Conflict).
 * 5. Guest check-in requirement mapping (403 Forbidden).
 * 6. Rate-limit / cooldown mapping (429 Too Many Requests).
 * 
 * NOTE: This suite tests application controller contracts and error code mappings in Vitest.
 * It is NOT a live staging environment test against a deployed PostgreSQL/Supabase database.
 */

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    from: mocks.from,
  }),
}));

describe('POST /api/v1/visits - Mocked Route Handler Integration Tests (Contract Verification)', () => {
  const merchantId = '11111111-1111-4111-8111-111111111111';
  const orgId = '22222222-2222-4222-8222-222222222222';
  const branchId = '33333333-3333-4333-8333-333333333333';
  const validGuestId = '44444444-4444-4444-8444-444444444444';
  const idempotencyKey = '55555555-5555-4555-8555-555555555555';
  const visitId = '66666666-6666-4666-8666-666666666666';

  const unverifiedGuestId = '77777777-7777-4777-8777-777777777777';
  const unverifiedKey = '77777777-7777-4777-8777-888888888888';

  const cooldownGuestId = '88888888-8888-4888-8888-888888888888';
  const cooldownKey = '88888888-8888-4888-8888-999999999999';

  const conflictCustomerId = '99999999-9999-4999-8999-999999999999';

  let committedVisits: Array<{ id: string; customerId: string; branchId: string; key: string }>;

  beforeEach(() => {
    vi.clearAllMocks();
    committedVisits = [];

    // 1. Default authentic merchant session
    mocks.getUser.mockResolvedValue({
      data: { user: { id: merchantId, email: 'cashier@stampy.app' } },
      error: null,
    });

    // 2. Table resolution for branch & organization membership
    mocks.from.mockImplementation((table: string) => {
      if (table === 'branches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: branchId, organization_id: orgId, status: 'active' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'organization_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'mem-1', organization_id: orgId, branch_id: null, role: 'cashier' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'visits') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: vi.fn().mockImplementation(async () => ({
                  count: committedVisits.length,
                  error: null,
                })),
              }),
            }),
          }),
        };
      }
      if (table === 'reward_rules') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    // 3. Simulated RPC record_verified_visit execution adhering to Postgres constraints
    mocks.rpc.mockImplementation(async (proc: string, args: any) => {
      if (proc !== 'record_verified_visit') {
        throw new Error('Unknown procedure: ' + proc);
      }

      // Check for key collision with different payload
      const existingKeyMatch = committedVisits.find((v) => v.key === args.p_idempotency_key);
      if (existingKeyMatch) {
        if (existingKeyMatch.customerId !== args.p_customer_id || existingKeyMatch.branchId !== args.p_branch_id) {
          return { data: null, error: { code: '22023', message: 'Idempotency key belongs to a different visit' } };
        }
        // Identical replay: return existing visit without inserting a new row
        return {
          data: { visitId: existingKeyMatch.id, replayed: true },
          error: null,
        };
      }

      // Check-in verification simulation: fail if guest has no check-in
      if (args.p_customer_id === unverifiedGuestId) {
        return { data: null, error: { code: '42501', message: 'Guest check-in required for this branch within the last 2 hours' } };
      }

      // Cooldown verification simulation
      if (args.p_customer_id === cooldownGuestId) {
        return { data: null, error: { code: '23514', message: 'Visit cooldown active: 1 hour required between verified visits' } };
      }

      // Fresh visit commit: atomically record visit
      committedVisits.push({
        id: visitId,
        customerId: args.p_customer_id,
        branchId: args.p_branch_id,
        key: args.p_idempotency_key,
      });

      return {
        data: { visitId: visitId, replayed: false },
        error: null,
      };
    });
  });

  it('Contract 1: Rejects unauthenticated caller with 401 Unauthorized', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const req = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: validGuestId, branchId, idempotencyKey }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('Contract 2: Rejects unauthorized organization role with 403 Forbidden', async () => {
    mocks.from.mockImplementationOnce((table: string) => {
      if (table === 'branches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: branchId, organization_id: orgId, status: 'active' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
    mocks.from.mockImplementationOnce((table: string) => {
      if (table === 'organization_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'mem-1', organization_id: orgId, branch_id: null, role: 'viewer' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: validGuestId, branchId, idempotencyKey }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('does not have visit stamping permissions');
  });

  it('Contract 3: Route Handler Contract — Validates fresh visit handling and idempotent replay with single-record contract', async () => {
    // 1. Initial attempt: Fresh verified visit
    const freshReq = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: validGuestId,
        branchId,
        idempotencyKey,
      }),
    });

    const freshRes = await POST(freshReq);
    expect(freshRes.status).toBe(200);
    const freshBody = await freshRes.json();

    expect(freshBody.success).toBe(true);
    expect(freshBody.visitId).toBe(visitId);
    expect(freshBody.replayed).toBe(false);
    expect(freshBody.currentVisits).toBe(1);
    expect(committedVisits.length).toBe(1);

    // 2. Replay attempt: Retry with identical idempotencyKey
    const replayReq = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: validGuestId,
        branchId,
        idempotencyKey,
      }),
    });

    const replayRes = await POST(replayReq);
    expect(replayRes.status).toBe(200);
    const replayBody = await replayRes.json();

    expect(replayBody.success).toBe(true);
    expect(replayBody.visitId).toBe(visitId);
    expect(replayBody.replayed).toBe(true);
    expect(replayBody.currentVisits).toBe(1);

    // CRITICAL STAGING ASSERTION: Exactly ONE visit row committed in the database!
    expect(committedVisits.length).toBe(1);
  });

  it('Contract 4: Enforces 409 Conflict when key is reused with different customer payload', async () => {
    committedVisits.push({
      id: visitId,
      customerId: validGuestId,
      branchId,
      key: idempotencyKey,
    });

    const conflictReq = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: conflictCustomerId,
        branchId,
        idempotencyKey,
      }),
    });

    const conflictRes = await POST(conflictReq);
    expect(conflictRes.status).toBe(409);
    const body = await conflictRes.json();
    expect(body.error).toContain('Idempotency key belongs to a different visit');
  });

  it('Contract 5: Enforces 403 Forbidden when guest has no check-in within 2 hours', async () => {
    const noCheckinReq = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: unverifiedGuestId,
        branchId,
        idempotencyKey: unverifiedKey,
      }),
    });

    const res = await POST(noCheckinReq);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Guest check-in required');
  });

  it('Contract 6: Enforces 429 Too Many Requests when cooldown period is violated', async () => {
    const cooldownReq = new NextRequest('https://stampy.test/api/v1/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: cooldownGuestId,
        branchId,
        idempotencyKey: cooldownKey,
      }),
    });

    const res = await POST(cooldownReq);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Visit cooldown active');
  });
});
