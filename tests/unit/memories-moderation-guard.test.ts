import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as memoriesGET } from '@/app/api/v1/memories/route';

/**
 * Moderation-bypass guard: `status=all` / `visibility=all` expose
 * pending/rejected/hidden rows and must reject anonymous callers
 * (CWE-862), staying pinned to approved+live_wall instead.
 */

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: vi.fn(() => {
      const b: any = {
        select: vi.fn(() => b),
        order: vi.fn(() => b),
        range: vi.fn(() => b),
        eq: vi.fn(() => b),
        neq: vi.fn(() => b),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      return b;
    }),
  }),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

function req(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/v1/memories moderation bypass guard', () => {
  it('rejects anonymous status=all with 401', async () => {
    const res = await memoriesGET(req('http://localhost/api/v1/memories?status=all'));
    expect(res.status).toBe(401);
  });

  it('rejects anonymous visibility=all with 401', async () => {
    const res = await memoriesGET(req('http://localhost/api/v1/memories?visibility=all'));
    expect(res.status).toBe(401);
  });

  it('keeps default (approved+live_wall) public for guests', async () => {
    const res = await memoriesGET(req('http://localhost/api/v1/memories'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('keeps explicit status=approved public for guests', async () => {
    const res = await memoriesGET(req('http://localhost/api/v1/memories?status=approved&visibility=live_wall'));
    expect(res.status).toBe(200);
  });

  it('accepts status=all with a signed staff cookie', async () => {
    const { createStaffSessionValue, STAFF_SESSION_COOKIE } = await import('@/lib/staff-session');
    const r = req('http://localhost/api/v1/memories?status=all');
    r.cookies.set(
      STAFF_SESSION_COOKIE,
      await createStaffSessionValue({ staffId: 'staff-1', cafeSlug: 'memories', role: 'admin' })
    );
    const res = await memoriesGET(r);
    expect(res.status).toBe(200);
  });
});
