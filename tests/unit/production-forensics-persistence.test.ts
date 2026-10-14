import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE as deleteMemory } from '@/app/api/v1/memories/route';
import { createStaffSessionValue, STAFF_SESSION_COOKIE } from '@/lib/staff-session';

// DELETE /api/v1/memories is staff-guarded (CWE-862) — mint a valid cookie.
async function staffedRequest(url: string): Promise<NextRequest> {
  const req = new NextRequest(url, { method: 'DELETE' });
  req.cookies.set(
    STAFF_SESSION_COOKIE,
    await createStaffSessionValue({ staffId: 'staff-1', cafeSlug: 'memories', role: 'admin' })
  );
  return req;
}

vi.mock('@/lib/supabase/admin', () => {
  return {
    createAdminClient: vi.fn(() => ({
      from: vi.fn((table: string) => ({
        delete: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => {
            if (val === 'mem_test_fail') {
              return { error: { message: 'Database deletion constraint error' } };
            }
            return { error: null };
          }),
        })),
      })),
    })),
  };
});

describe('Production Forensics Persistence Auditing', () => {
  it('rejects DELETE /api/v1/memories when memoryId is missing', async () => {
    const req = await staffedRequest('http://localhost:3000/api/v1/memories');
    const res = await deleteMemory(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('memoryId is required');
  });

  it('successfully executes DELETE /api/v1/memories with valid memoryId query param', async () => {
    const req = await staffedRequest('http://localhost:3000/api/v1/memories?memoryId=mem_12345');
    const res = await deleteMemory(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.memoryId).toBe('mem_12345');
  });

  it('returns 500 when database delete fails', async () => {
    const req = await staffedRequest('http://localhost:3000/api/v1/memories?memoryId=mem_test_fail');
    const res = await deleteMemory(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to delete memory');
  });
});
