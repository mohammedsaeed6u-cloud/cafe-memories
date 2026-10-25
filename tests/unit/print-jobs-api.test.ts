import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/v1/print/jobs/route';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const BRANCH_ID = '22222222-2222-4222-8222-222222222222';
const MEMORY_ID = '33333333-3333-4333-8333-333333333333';
const JOB_ID = '44444444-4444-4444-8444-444444444444';

const mockRequireOperator = vi.fn();

vi.mock('@/lib/server/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/context')>();
  return {
    ...actual,
    requireOperator: (...args: unknown[]) => mockRequireOperator(...args),
  };
});

vi.mock('@/lib/server/memory-urls', () => ({
  signedMemoryUrl: vi.fn(async (key: string) => `https://signed.example/${key}`),
  signedMemoryUrlMap: vi.fn(
    async (keys: string[]) => new Map(keys.map((key) => [key, `https://signed.example/${key}`]))
  ),
}));

type TableResult = { data?: unknown; error?: unknown };

const tableResults: Record<string, TableResult[]> = {};
const insertedRows: Record<string, unknown[]> = {};
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
  builder.insert = vi.fn((payload: unknown) => {
    (insertedRows[table] ??= []).push(payload);
    return builder;
  });
  builder.update = vi.fn((payload: unknown) => {
    (updatedRows[table] ??= []).push(payload);
    return builder;
  });
  builder.delete = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.is = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.limit = vi.fn(chain);
  builder.maybeSingle = vi.fn(async () => nextResult(table));
  builder.single = vi.fn(async () => nextResult(table));
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(nextResult(table)).then(resolve, reject);
  builders[table] = builder;
  return builder;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => builderFor(table),
  }),
}));

const operator = {
  source: 'merchant' as const,
  memberId: 'member-1',
  userId: 'user-1',
  email: 'owner@example.com',
  role: 'owner' as const,
  organization: {
    id: ORG_ID,
    slug: 'demo',
    name: 'Demo Café',
    status: 'active',
    settings: {},
  },
  branchId: null as string | null,
};

function authorize(branchId: string | null = null) {
  mockRequireOperator.mockResolvedValue({
    context: { ...operator, branchId },
    error: null,
  });
}

function unauthorized() {
  mockRequireOperator.mockResolvedValue({
    context: null,
    error: { status: 401, code: 'unauthenticated', message: 'Authentication required' },
  });
}

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${url}`, init);
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Print Jobs API (/api/v1/print/jobs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(tableResults)) delete tableResults[key];
    for (const key of Object.keys(insertedRows)) delete insertedRows[key];
    for (const key of Object.keys(updatedRows)) delete updatedRows[key];
    for (const key of Object.keys(builders)) delete builders[key];
    authorize();
  });

  it('rejects every verb without a verified operator', async () => {
    unauthorized();
    expect((await GET(request('/api/v1/print/jobs'))).status).toBe(401);
    expect(
      (
        await POST(
          jsonRequest('/api/v1/print/jobs', 'POST', {
            storageKey: `${ORG_ID}/memories/a.webp`,
          })
        )
      ).status
    ).toBe(401);
    expect(
      (
        await PATCH(
          jsonRequest('/api/v1/print/jobs', 'PATCH', { id: JOB_ID, status: 'printed' })
        )
      ).status
    ).toBe(401);
    expect((await DELETE(request(`/api/v1/print/jobs?id=${JOB_ID}`))).status).toBe(401);
  });

  it('returns only the operator organization jobs with signed image URLs', async () => {
    tableResults.print_jobs = [
      {
        data: [
          {
            id: JOB_ID,
            status: 'pending',
            format: 'standard-2x6',
            copies: 1,
            photo_url: `${ORG_ID}/memories/a.webp`,
            created_at: '2026-10-25T10:00:00.000Z',
            printed_at: null,
            error: null,
            memory_id: MEMORY_ID,
            customer_id: 'customer-1',
            customers: { display_name: 'نورة', phone: '0551234567' },
          },
        ],
        error: null,
      },
    ];

    const response = await GET(request('/api/v1/print/jobs'));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.jobs).toHaveLength(1);
    expect(json.jobs[0]).toMatchObject({
      id: JOB_ID,
      name: 'نورة',
      phone: '0551234567',
      status: 'pending',
      memoryId: MEMORY_ID,
    });
    expect(json.jobs[0].photoStripUrl).toContain('https://signed.example/');

    expect(builders.print_jobs.eq).toHaveBeenCalledWith('organization_id', ORG_ID);
    expect(builders.print_jobs.eq).toHaveBeenCalledWith('status', 'pending');
    expect(builders.print_jobs.eq).not.toHaveBeenCalledWith('organization_id', OTHER_ORG_ID);
  });

  it('scopes the queue to the active branch when the operator has one', async () => {
    authorize(BRANCH_ID);
    tableResults.print_jobs = [{ data: [], error: null }];

    const response = await GET(request('/api/v1/print/jobs'));
    expect(response.status).toBe(200);
    expect(builders.print_jobs.eq).toHaveBeenCalledWith('branch_id', BRANCH_ID);
  });

  it('rejects an unknown status filter', async () => {
    const response = await GET(request('/api/v1/print/jobs?status=exploded'));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_status');
  });

  it('rejects an enqueue without a memoryId or storageKey', async () => {
    const response = await POST(jsonRequest('/api/v1/print/jobs', 'POST', { format: '4x6' }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_payload');
  });

  it('rejects an image key that belongs to another organization', async () => {
    const response = await POST(
      jsonRequest('/api/v1/print/jobs', 'POST', {
        storageKey: `${OTHER_ORG_ID}/memories/a.webp`,
      })
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_image');
  });

  it('refuses a memory from another organization', async () => {
    tableResults.memories = [
      {
        data: {
          id: MEMORY_ID,
          original_url: `${OTHER_ORG_ID}/memories/a.webp`,
          optimized_url: null,
          thumbnail_url: null,
          customer_id: null,
          organization_id: OTHER_ORG_ID,
          branch_id: BRANCH_ID,
        },
        error: null,
      },
    ];

    const response = await POST(
      jsonRequest('/api/v1/print/jobs', 'POST', { memoryId: MEMORY_ID })
    );
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.code).toBe('memory_not_found');
  });

  it('enqueues a tenant memory with its private storage key', async () => {
    authorize(BRANCH_ID);
    tableResults.memories = [
      {
        data: {
          id: MEMORY_ID,
          original_url: `${ORG_ID}/memories/a.webp`,
          optimized_url: `${ORG_ID}/memories/a-opt.webp`,
          thumbnail_url: `${ORG_ID}/memories/a-thumb.webp`,
          customer_id: 'customer-1',
          organization_id: ORG_ID,
          branch_id: BRANCH_ID,
        },
        error: null,
      },
    ];
    tableResults.print_jobs = [
      { data: null, error: null },
      {
        data: {
          id: JOB_ID,
          status: 'pending',
          format: 'standard-2x6',
          copies: 2,
          created_at: '2026-10-25T10:00:00.000Z',
        },
        error: null,
      },
    ];

    const response = await POST(
      jsonRequest('/api/v1/print/jobs', 'POST', {
        memoryId: MEMORY_ID,
        format: 'standard-2x6',
        copies: 2,
      })
    );

    expect(response.status, await response.clone().text()).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.duplicate).toBe(false);
    expect(json.job.id).toBe(JOB_ID);
    expect(json.job.photoUrl).toContain('https://signed.example/');

    expect(insertedRows.print_jobs[0]).toMatchObject({
      organization_id: ORG_ID,
      branch_id: BRANCH_ID,
      memory_id: MEMORY_ID,
      customer_id: 'customer-1',
      status: 'pending',
      format: 'standard-2x6',
      copies: 2,
      photo_url: `${ORG_ID}/memories/a-opt.webp`,
    });
  });

  it('returns the existing pending job instead of duplicating it', async () => {
    tableResults.memories = [
      {
        data: {
          id: MEMORY_ID,
          original_url: `${ORG_ID}/memories/a.webp`,
          optimized_url: null,
          thumbnail_url: null,
          customer_id: null,
          organization_id: ORG_ID,
          branch_id: BRANCH_ID,
        },
        error: null,
      },
    ];
    tableResults.print_jobs = [{ data: { id: JOB_ID }, error: null }];

    const response = await POST(
      jsonRequest('/api/v1/print/jobs', 'POST', { memoryId: MEMORY_ID })
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.duplicate).toBe(true);
    expect(json.job.id).toBe(JOB_ID);
    expect(insertedRows.print_jobs).toBeUndefined();
  });

  it('advances a job and stamps printed_at', async () => {
    tableResults.print_jobs = [
      {
        data: { id: JOB_ID, organization_id: ORG_ID, branch_id: BRANCH_ID, status: 'printing' },
        error: null,
      },
      { data: null, error: null },
    ];

    const response = await PATCH(
      jsonRequest('/api/v1/print/jobs', 'PATCH', { id: JOB_ID, status: 'printed' })
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ jobId: JOB_ID, status: 'printed' });

    expect(updatedRows.print_jobs[0]).toMatchObject({ status: 'printed' });
    expect(typeof (updatedRows.print_jobs[0] as { printed_at?: string }).printed_at).toBe('string');
  });

  it('refuses to update a job from another organization', async () => {
    tableResults.print_jobs = [
      {
        data: { id: JOB_ID, organization_id: OTHER_ORG_ID, branch_id: null, status: 'pending' },
        error: null,
      },
    ];

    const response = await PATCH(
      jsonRequest('/api/v1/print/jobs', 'PATCH', { id: JOB_ID, status: 'printed' })
    );
    expect(response.status).toBe(404);
    expect(updatedRows.print_jobs).toBeUndefined();
  });

  it('dismisses a job with a soft delete instead of dropping the row', async () => {
    tableResults.print_jobs = [
      {
        data: { id: JOB_ID, organization_id: ORG_ID, branch_id: BRANCH_ID },
        error: null,
      },
      { data: null, error: null },
    ];

    const response = await DELETE(request(`/api/v1/print/jobs?id=${JOB_ID}`));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ jobId: JOB_ID, status: 'dismissed' });
    expect(updatedRows.print_jobs[0]).toMatchObject({ status: 'dismissed' });
    expect(builders.print_jobs.delete).not.toHaveBeenCalled();
  });

  it('rejects a non-UUID id on dismiss', async () => {
    const response = await DELETE(request('/api/v1/print/jobs?id=not-a-uuid'));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_id');
  });
});
