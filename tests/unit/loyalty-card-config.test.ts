import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/loyalty/card-config/route';
import { resetStaffAuthState } from '@/lib/services/staff-auth.service';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

function builder(result: { data?: any; error?: any } = {}) {
  const queryResult = { data: result.data ?? null, error: result.error ?? null, count: null };
  const b: any = {
    select: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    eq: vi.fn(() => b),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    maybeSingle: vi.fn(async () => queryResult),
    single: vi.fn(async () => queryResult),
    then: (resolve: any, reject: any) => Promise.resolve(queryResult).then(resolve, reject),
  };
  return b;
}

function cfgTable(config: Record<string, any>) {
  const counts: Record<string, number> = {};
  return (table: string) => {
    counts[table] = (counts[table] || 0) + 1;
    const setting = config[table];
    let result = { data: null, error: null };
    if (Array.isArray(setting)) {
      result = setting[counts[table] - 1] ?? setting[setting.length - 1] ?? result;
    } else if (setting !== undefined) {
      result = setting;
    }
    return builder(result);
  };
}

function requestFor(url: string, init?: { method?: string; body?: any }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    ...(init?.body !== undefined
      ? { body: JSON.stringify(init.body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
}

describe('GET /api/v1/loyalty/card-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStaffAuthState();
  });
  afterEach(() => vi.resetAllMocks());

  it('returns the active rule threshold as totalSlots', async () => {
    mockFrom.mockImplementation(cfgTable({ reward_rules: { data: { threshold: 7, name: 'هدية 7 زيارات' } } }));
    const res = await GET(requestFor('http://localhost/api/v1/loyalty/card-config?cafeSlug=demo'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.totalSlots).toBe(7);
  });

  it('falls back to 5 when no active rule exists', async () => {
    mockFrom.mockImplementation(cfgTable({ reward_rules: { data: null } }));
    const res = await GET(requestFor('http://localhost/api/v1/loyalty/card-config?cafeSlug=demo'));
    const json = await res.json();
    expect(json.totalSlots).toBe(5);
  });

  it('rejects a missing cafeSlug with 400', async () => {
    const res = await GET(requestFor('http://localhost/api/v1/loyalty/card-config'));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/loyalty/card-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStaffAuthState();
  });
  afterEach(() => vi.resetAllMocks());

  it('rejects invalid payload with 400', async () => {
    const res = await POST(requestFor('http://localhost/api/v1/loyalty/card-config', {
      method: 'POST',
      body: { totalSlots: 99, staffPin: '1234' },
    }));
    expect(res.status).toBe(400);
  });

  it('rejects a wrong PIN with 401', async () => {
    const res = await POST(requestFor('http://localhost/api/v1/loyalty/card-config', {
      method: 'POST',
      body: { totalSlots: 7, staffPin: '0000' },
    }));
    expect(res.status).toBe(401);
  });

  it('updates the active rule when the PIN is valid', async () => {
    mockFrom.mockImplementation(cfgTable({ reward_rules: { data: { id: 'rule-1' } } }));
    const res = await POST(requestFor('http://localhost/api/v1/loyalty/card-config', {
      method: 'POST',
      body: { totalSlots: 7, staffPin: '1234' },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.totalSlots).toBe(7);
  });
});
