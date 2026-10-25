import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, POST } from '@/app/api/v1/merchant/readers/route';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_A = '22222222-2222-4222-8222-222222222222';
const BRANCH_B = '33333333-3333-4333-8333-333333333333';
const READER_ID = '44444444-4444-4444-8444-444444444444';

const mockRequireOperator = vi.fn();
const mockAudit = vi.fn();

vi.mock('@/lib/server/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/context')>();
  return {
    ...actual,
    requireOperator: (...args: unknown[]) => mockRequireOperator(...args),
  };
});

vi.mock('@/lib/server/route-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/route-helpers')>();
  return { ...actual, writeAuditLog: (...args: unknown[]) => mockAudit(...args) };
});

type TableResult = { data?: unknown; error?: unknown };
const tableResults: Record<string, TableResult[]> = {};
const calls: Record<string, Array<{ method: string; args: unknown[] }>> = {};

function nextResult(table: string): TableResult {
  const queue = tableResults[table];
  if (!queue || queue.length === 0) return { data: null, error: null };
  return queue.length === 1 ? queue[0] : queue.shift()!;
}

function record(table: string, method: string, args: unknown[]) {
  (calls[table] ??= []).push({ method, args });
}

function builderFor(table: string) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = (method: string) =>
    vi.fn((...args: unknown[]) => {
      record(table, method, args);
      return builder;
    });

  builder.select = chain('select');
  builder.eq = chain('eq');
  builder.neq = chain('neq');
  builder.order = chain('order');
  builder.limit = chain('limit');
  builder.match = chain('match');
  builder.insert = vi.fn((payload: unknown) => {
    record(table, 'insert', [payload]);
    return builder;
  });
  builder.update = vi.fn((payload: unknown) => {
    record(table, 'update', [payload]);
    return builder;
  });
  builder.maybeSingle = vi.fn(async () => nextResult(table));
  builder.single = vi.fn(async () => nextResult(table));
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(nextResult(table)).then(resolve, reject);
  return builder;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (table: string) => builderFor(table) }),
}));

const operator = {
  source: 'merchant' as const,
  memberId: 'member-1',
  userId: 'user-1',
  email: 'manager@example.com',
  role: 'manager' as const,
  organization: { id: ORG_ID, slug: 'cafe', name: 'Café', status: 'active', settings: {} },
  branchId: null as string | null,
};

function authorize(branchId: string | null = null) {
  mockRequireOperator.mockResolvedValue({ context: { ...operator, branchId }, error: null });
}

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  });
}

describe('Merchant reader branch scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(tableResults)) delete tableResults[key];
    for (const key of Object.keys(calls)) delete calls[key];
    authorize();
  });

  it('lists only readers from the manager branch', async () => {
    authorize(BRANCH_A);
    tableResults.nfc_readers = [{ data: [], error: null }];

    const response = await GET(
      jsonRequest('http://localhost:3000/api/v1/merchant/readers', 'GET')
    );
    expect(response.status).toBe(200);
    expect(calls.nfc_readers).toContainEqual({
      method: 'match',
      args: [{ branch_id: BRANCH_A }],
    });
  });

  it('refuses to create a reader for another branch', async () => {
    authorize(BRANCH_A);

    const response = await POST(
      jsonRequest('http://localhost:3000/api/v1/merchant/readers', 'POST', {
        label: 'Counter',
        branchId: BRANCH_B,
      })
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('branch_scope');
    expect(calls.nfc_readers?.some((call) => call.method === 'insert')).toBeFalsy();
  });

  it('refuses to rotate a reader outside the manager branch', async () => {
    authorize(BRANCH_A);
    tableResults.nfc_readers = [
      {
        data: {
          id: READER_ID,
          public_id: 'aaaaaaaaaaaa',
          status: 'active',
          label: 'Counter',
          branch_id: BRANCH_B,
        },
        error: null,
      },
    ];

    const response = await PATCH(
      jsonRequest('http://localhost:3000/api/v1/merchant/readers', 'PATCH', {
        id: READER_ID,
        action: 'rotate',
      })
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('branch_scope');
    expect(calls.nfc_readers?.some((call) => call.method === 'update')).toBeFalsy();
    expect(mockAudit).not.toHaveBeenCalled();
  });
});
