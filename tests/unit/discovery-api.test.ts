import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/v1/merchant/discovery/route';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_BRANCH_ID = '33333333-3333-4333-8333-333333333333';

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
const updatedRows: Record<string, unknown[]> = {};
const builders: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};

function nextResult(table: string): TableResult {
  const queue = tableResults[table];
  if (!queue || queue.length === 0) return { data: null, error: null };
  return queue.length === 1 ? queue[0] : queue.shift()!;
}

function builderFor(table: string) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.update = vi.fn((payload: unknown) => {
    (updatedRows[table] ??= []).push(payload);
    return builder;
  });
  builder.eq = vi.fn(chain);
  builder.neq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.maybeSingle = vi.fn(async () => nextResult(table));
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(nextResult(table)).then(resolve, reject);
  builders[table] = builder;
  return builder;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (table: string) => builderFor(table) }),
}));

const operator = {
  source: 'merchant' as const,
  memberId: 'member-1',
  userId: 'user-1',
  email: 'owner@example.com',
  role: 'owner' as const,
  organization: { id: ORG_ID, slug: 'cafe', name: 'Café', status: 'active', settings: {} },
  branchId: null as string | null,
};

function authorize(branchId: string | null = null) {
  mockRequireOperator.mockResolvedValue({ context: { ...operator, branchId }, error: null });
}

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/v1/merchant/discovery', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function branchExists(latitude: number | null = null, longitude: number | null = null) {
  tableResults.branches = [{ data: { id: BRANCH_ID, latitude, longitude }, error: null }];
}

describe('Discovery settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(tableResults)) delete tableResults[key];
    for (const key of Object.keys(updatedRows)) delete updatedRows[key];
    for (const key of Object.keys(builders)) delete builders[key];
    authorize();
  });

  it('requires a payload', async () => {
    const response = await PATCH(jsonRequest({}));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('nothing_to_update');
  });

  it('rejects an unknown category before touching the database', async () => {
    const response = await PATCH(jsonRequest({ organization: { category: 'casino' } }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('invalid_discovery');
    expect(updatedRows.organizations).toBeUndefined();
  });

  it('rejects a half-specified coordinate pair against the stored branch', async () => {
    branchExists(null, null);
    const response = await PATCH(
      jsonRequest({ branch: { id: BRANCH_ID, latitude: 24.7 } })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('invalid_coordinates');
    expect(updatedRows.branches).toBeUndefined();
  });

  it('keeps a manager inside their assigned branch', async () => {
    authorize(OTHER_BRANCH_ID);
    const response = await PATCH(
      jsonRequest({ branch: { id: BRANCH_ID, isDiscoverable: true } })
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('branch_scope');
  });

  it('saves organization and branch settings and audits both', async () => {
    branchExists(null, null);
    const response = await PATCH(
      jsonRequest({
        organization: { category: 'cafe', isDiscoverable: true, headStartStamps: 2 },
        branch: {
          id: BRANCH_ID,
          isDiscoverable: true,
          description: '  قهوة مختصة  ',
          phone: '  ',
          address: 'الرياض',
          latitude: 24.7136,
          longitude: 46.6753,
          openingHours: { mon: { open: '09:00', close: '23:00' } },
          amenities: ['wifi', 'parking'],
        },
      })
    );

    expect(response.status).toBe(200);
    expect(updatedRows.organizations).toEqual([
      { category: 'cafe', is_discoverable: true, head_start_stamps: 2 },
    ]);
    expect(updatedRows.branches).toEqual([
      {
        is_discoverable: true,
        description: 'قهوة مختصة',
        phone: null,
        address: 'الرياض',
        latitude: 24.7136,
        longitude: 46.6753,
        opening_hours: { mon: { open: '09:00', close: '23:00' } },
        amenities: ['wifi', 'parking'],
      },
    ]);
    expect(mockAudit).toHaveBeenCalledTimes(2);
    expect(mockAudit.mock.calls.map(([entry]) => entry.action)).toEqual([
      'discovery.organization_updated',
      'discovery.branch_updated',
    ]);
  });

  it('returns the organization and branch state for the dashboard', async () => {
    tableResults.organizations = [
      { data: { category: 'cafe', is_discoverable: true, head_start_stamps: 1 }, error: null },
    ];
    tableResults.branches = [
      {
        data: [
          {
            id: BRANCH_ID,
            name: 'الفرع الرئيسي',
            slug: 'main',
            address: null,
            latitude: null,
            longitude: null,
            is_discoverable: true,
            description: null,
            phone: null,
            opening_hours: {},
            amenities: null,
          },
        ],
        error: null,
      },
    ];

    const response = await GET(
      new NextRequest('http://localhost:3000/api/v1/merchant/discovery')
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.organization).toEqual({
      category: 'cafe',
      isDiscoverable: true,
      headStartStamps: 1,
    });
    expect(body.branches[0]).toMatchObject({ id: BRANCH_ID, amenities: [], openingHours: {} });
  });
});
