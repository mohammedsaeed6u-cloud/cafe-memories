import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/wallet/pass/update/route';
import { computeStampedCount } from '@/lib/services/wallet-pass-sync.service';
import { buildWalletWalletRequest, STAMP_CHANGE_MESSAGE } from '@/lib/services/wallet-pass.service';
import { createStaffSessionValue, STAFF_SESSION_COOKIE } from '@/lib/staff-session';

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
    in: vi.fn(() => b),
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

const ENV_SNAPSHOT = { ...process.env };

async function requestFor(body: any) {
  const req = new NextRequest('http://localhost/api/v1/wallet/pass/update', {
    method: 'POST',
    ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
  // The route is staff-guarded (CWE-306) — present a valid signed cookie.
  req.cookies.set(
    STAFF_SESSION_COOKIE,
    await createStaffSessionValue({ staffId: 'staff-1', cafeSlug: 'memories', role: 'staff' })
  );
  return req;
}

describe('computeStampedCount', () => {
  it('mirrors the stamps route math: filter, sort oldest-first, cap', () => {
    const memories = [
      { created_at: '2026-01-03', status: 'approved', branches: { id: 'b1' } },
      { created_at: '2026-01-01', status: 'approved', branches: { id: 'b1' } },
      { created_at: '2026-01-02', status: 'deleted', branches: { id: 'b1' } },
      { created_at: '2026-01-04', status: 'approved', branches: { id: 'b2' } },
    ];
    expect(computeStampedCount(memories, new Set(['b1']), 5)).toBe(2);
  });

  it('caps at the card size', () => {
    const memories = Array.from({ length: 9 }, (_, i) => ({
      created_at: `2026-01-0${i + 1}`,
      status: 'approved',
      branches: { id: 'b1' },
    }));
    expect(computeStampedCount(memories, new Set(['b1']), 5)).toBe(5);
  });
});

describe('buildWalletWalletRequest changeMessage', () => {
  it('attaches the lock-screen banner to the stamps header field', () => {
    const body = buildWalletWalletRequest({
      cafeSlug: 'demo',
      cafeName: 'Demo',
      customerPhone: '01055512345',
      stampedCount: 3,
      maxSlots: 5,
    });
    expect(body.headerFields[0].value).toBe('3/5');
    expect(body.headerFields[0].changeMessage).toBe(STAMP_CHANGE_MESSAGE);
    expect(STAMP_CHANGE_MESSAGE).toContain('%@');
  });

  it('honors a stampedCount override for PUT updates', () => {
    const body = buildWalletWalletRequest(
      { cafeSlug: 'demo', cafeName: 'Demo', customerPhone: '01055512345', stampedCount: 0, maxSlots: 5 },
      5
    );
    expect(body.headerFields[0].value).toBe('5/5');
    expect(body.primaryFields[0].label).toContain('جاهزة');
  });
});

describe('POST /api/v1/wallet/pass/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV_SNAPSHOT, NEXT_PUBLIC_WALLETWALLET_ENABLED: '1', WALLETWALLET_API_KEY: 'ww_live_test' };
  });
  afterEach(() => {
    process.env = ENV_SNAPSHOT;
    vi.unstubAllGlobals();
  });

  it('rejects a missing body with 400', async () => {
    const res = await POST(await requestFor(undefined));
    expect(res.status).toBe(400);
  });

  it('returns no_pass quietly when the customer has no issued pass', async () => {
    mockFrom.mockImplementation(
      cfgTable({
        customers: { data: { id: 'c1', memories: [] } },
        wallet_pass_links: { data: null },
        reward_rules: { data: { threshold: 5 } },
        branches: { data: [{ id: 'b1', slug: 'demo' }] },
      })
    );
    const res = await POST(await requestFor({ cafeSlug: 'demo', phone: '01055512345' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sync.reason).toBe('no_pass');
    expect(json.sync.updated).toBe(false);
  });

  it('returns outsourcing_disabled when the flag is off', async () => {
    process.env = { ...ENV_SNAPSHOT };
    delete process.env.NEXT_PUBLIC_WALLETWALLET_ENABLED;
    const res = await POST(await requestFor({ cafeSlug: 'demo', phone: '01055512345' }));
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sync.reason).toBe('outsourcing_disabled');
  });

  it('pushes the new count upstream and records it', async () => {
    mockFrom.mockImplementation(
      cfgTable({
        customers: { data: { id: 'c1', memories: [{ created_at: '2026-01-01', status: 'approved', branches: { id: 'b1' } }] } },
        wallet_pass_links: { data: { id: 'w1', pass_serial: 'sn-777', last_stamped_count: 0 } },
        reward_rules: { data: { threshold: 5 } },
        branches: { data: [{ id: 'b1', slug: 'demo' }] },
      })
    );
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ serialNumber: 'sn-777' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    vi.stubGlobal('fetch', fetchMock);
    const res = await POST(await requestFor({ cafeSlug: 'demo', phone: '01055512345' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sync.updated).toBe(true);
    expect(json.sync.serial).toBe('sn-777');
    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/passes/sn-777');
    expect(init.method).toBe('PUT');
    const sent = JSON.parse(init.body);
    expect(sent.headerFields[0].value).toBe('1/5');
    expect(sent.headerFields[0].changeMessage).toContain('%@');
  });

  it('answers 502 when the upstream update fails', async () => {
    mockFrom.mockImplementation(
      cfgTable({
        customers: { data: { id: 'c1', memories: [] } },
        wallet_pass_links: { data: { id: 'w1', pass_serial: 'sn-777', last_stamped_count: 3 } },
        reward_rules: { data: { threshold: 5 } },
        branches: { data: [{ id: 'b1', slug: 'demo' }] },
      })
    );
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    const res = await POST(await requestFor({ cafeSlug: 'demo', phone: '01055512345' }));
    expect(res.status).toBe(502);
  });
});
