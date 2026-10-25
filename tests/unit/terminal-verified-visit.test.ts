import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/visits/route';

// Hoisted mocks for Supabase SSR server client
const mocks = vi.hoisted(() => {
  return {
    getUser: vi.fn(),
    rpc: vi.fn(),
    from: vi.fn(),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    rpc: mocks.rpc,
    from: mocks.from,
  }),
}));

const merchantUserId = 'a1111111-1111-4111-8111-111111111111';
const orgId = 'b2222222-2222-4222-8222-222222222222';
const branchId = 'c3333333-3333-4333-8333-333333333333';
const customerId = 'd4444444-4444-4444-8444-444444444444';
const idempotencyKey = 'e5555555-5555-4555-8555-555555555555';
const visitId = 'f6666666-6666-4666-8666-666666666666';

const createPostRequest = (body: object) =>
  new NextRequest('https://stampy.test/api/v1/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/v1/visits - Server-Verified Visit Confirmation RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated merchant session
    mocks.getUser.mockResolvedValue({
      data: { user: { id: merchantUserId, email: 'merchant@stampy.app' } },
      error: null,
    });

    // Default table routing: branches, organization_members, visits, reward_rules
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
                  data: { id: 'mem-1', organization_id: orgId, branch_id: null, role: 'owner' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'visits') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 4, error: null }),
              }),
            }),
          }),
          insert: vi.fn(),
        };
      }
      if (table === 'reward_rules') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'rule-1', threshold: 5, reward_type: 'free_coffee' }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Default RPC result (successful new visit)
    mocks.rpc.mockResolvedValue({
      data: { visitId, replayed: false },
      error: null,
    });
  });

  it('rejects unauthenticated requests with HTTP 401 Unauthorized', async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects requests with malformed or missing UUID fields with HTTP 400 Bad Request', async () => {
    const res = await POST(createPostRequest({ customerId: 'not-a-uuid', branchId, idempotencyKey }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid payload');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects requests targeting an inactive or non-existent branch with HTTP 404', async () => {
    mocks.from.mockImplementationOnce((table: string) => {
      if (table === 'branches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Branch not found or inactive');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects caller if not a member of the branch organization with HTTP 403 Forbidden', async () => {
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
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No membership' } }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('not a member of this organization');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects caller if restricted to a different branch with HTTP 403 Forbidden', async () => {
    const anotherBranchId = '99999999-9999-4999-8999-999999999999';
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
                  data: { id: 'mem-1', organization_id: orgId, branch_id: anotherBranchId, role: 'staff' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('restricted to a different branch');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('maps RPC 42501 guest check-in failure to HTTP 403 with clear Arabic/English directive', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'Guest check-in required for this branch' },
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Guest check-in required');
  });

  it('maps RPC 23514 cooldown rejection to HTTP 429 Too Many Requests', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '23514', message: 'Visit cooldown active' },
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Visit cooldown active');
  });

  it('handles replayed duplicate requests returning HTTP 200 with replayed: true', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { visitId, replayed: true },
      error: null,
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.visitId).toBe(visitId);
    expect(json.replayed).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_visit', {
      p_customer_id: customerId,
      p_branch_id: branchId,
      p_idempotency_key: idempotencyKey,
    });
  });

  it('maps RPC 22023 idempotency mismatch to HTTP 409 Conflict', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '22023', message: 'Idempotency key belongs to a different visit' },
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Idempotency key belongs to a different visit');
  });

  it('rejects caller with unauthorized role (e.g. guest or viewer) with HTTP 403 Forbidden', async () => {
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

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('does not have visit stamping permissions');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('enforces fault isolation when count query returns an error object without throwing', async () => {
    // Supabase returns { data: null, count: null, error: { message: 'Database connection failed' } }
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
                  data: { id: 'mem-1', organization_id: orgId, branch_id: null, role: 'owner' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'visits') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: null,
                  error: { code: '500', message: 'Downstream visits count timeout' },
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.visitId).toBe(visitId);
    expect(json.progressFetchFailed).toBe(true);
    expect(json.currentVisits).toBeNull();
    expect(json.rewardProgress).toBeNull();
  });

  it('halts naive modulo calculations and explicitly returns rewardProgress as null for limited slice', async () => {
    const res = await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.visitId).toBe(visitId);
    expect(json.rewardProgress).toBeNull();
  });

  it('never performs direct visits table INSERT in POST handler', async () => {
    const visitsInsertSpy = vi.fn();
    mocks.from.mockImplementation((table: string) => {
      if (table === 'visits') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }),
            }),
          }),
          insert: visitsInsertSpy,
        };
      }
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
                  data: { id: 'mem-1', organization_id: orgId, branch_id: null, role: 'owner' },
                  error: null,
                }),
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
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'rule-1', threshold: 5, reward_type: 'free_coffee' }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    await POST(createPostRequest({ customerId, branchId, idempotencyKey }));
    expect(visitsInsertSpy).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_visit', expect.any(Object));
  });
});
