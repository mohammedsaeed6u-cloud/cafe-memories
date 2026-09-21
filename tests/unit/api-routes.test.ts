import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, normalizePhoneNumber, captureSchema } from '@/app/api/v1/photobooth/capture/route';
import { GET as healthGET } from '@/app/api/health/route';

// Clean isolated mock handles
const mockAdminFrom = vi.fn();
const mockServerFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockAdminFrom,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockServerFrom,
  })),
}));

// Helper to construct chainable query builder mocks
function createMockQueryBuilder(result: { data?: any; error?: any; count?: number | null } = {}) {
  const queryResult = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };

  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    maybeSingle: vi.fn().mockImplementation(async () => queryResult),
    single: vi.fn().mockImplementation(async () => queryResult),
    then: (resolve: any, reject: any) => Promise.resolve(queryResult).then(resolve, reject),
  };

  return builder;
}

// Helper to configure per-table mock behavior
function mockSupabaseTables(config: Record<string, any>) {
  const callCounts: Record<string, number> = {};

  return (tableName: string) => {
    callCounts[tableName] = (callCounts[tableName] || 0) + 1;
    const tableSetting = config[tableName];
    let result = { data: null, error: null, count: null };

    if (Array.isArray(tableSetting)) {
      const idx = callCounts[tableName] - 1;
      result = tableSetting[idx] ?? tableSetting[tableSetting.length - 1] ?? result;
    } else if (typeof tableSetting === 'function') {
      result = tableSetting();
    } else if (tableSetting !== undefined) {
      result = tableSetting;
    }

    return createMockQueryBuilder(result);
  };
}

describe('API Routes: Arabic Digit Normalization', () => {
  it('converts Arabic-Indic digits to standard ASCII numerals', () => {
    expect(normalizePhoneNumber('٠٥٠١٢٣٤٥٦٧')).toBe('0501234567');
    expect(normalizePhoneNumber('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('normalizes international numbers with leading plus sign and Arabic digits', () => {
    expect(normalizePhoneNumber('+٩٦٦٥٠١٢٣٤٥٦٧')).toBe('+966501234567');
  });

  it('handles mixed Arabic and Western digits correctly', () => {
    expect(normalizePhoneNumber('05٠12٣45٦7')).toBe('0501234567');
    expect(normalizePhoneNumber('+966-٥0-123-٤567')).toBe('+966501234567');
  });

  it('strips non-digit formatting characters while preserving leading plus', () => {
    expect(normalizePhoneNumber('+966 (50) 123-4567')).toBe('+966501234567');
    expect(normalizePhoneNumber('050-123-4567')).toBe('0501234567');
    expect(normalizePhoneNumber('  050 123 4567  ')).toBe('0501234567');
  });

  it('handles empty and whitespace strings gracefully', () => {
    expect(normalizePhoneNumber('')).toBe('');
    expect(normalizePhoneNumber('   ')).toBe('');
  });
});

describe('API Routes: Capture Schema Zod Validation', () => {
  const validOrgId = '123e4567-e89b-42d3-a456-426614174000';
  const validBranchId = '987fcdeb-51a2-43f7-9876-543210987654';

  it('accepts an empty payload using defaults', () => {
    const result = captureSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('زائر ومحب للقهوة');
      expect(result.data.frameId).toBe('ivory');
      expect(result.data.liveWallConsent).toBe(true);
    }
  });

  it('accepts a fully populated valid payload with Arabic content', () => {
    const payload = {
      name: 'محمد عبدالله',
      phone: '٠٥٠١٢٣٤٥٦٧',
      role: 'عاشق اسبريسو',
      caption: 'أجمل قهوة صباحية في الرياض ☕️',
      frameId: 'vintage_wood',
      organizationId: validOrgId,
      branchId: validBranchId,
      cafeSlug: 'espresso-lab',
      liveWallConsent: false,
    };
    const result = captureSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  describe('Name validation edge cases', () => {
    it('rejects empty string name', () => {
      const result = captureSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const longName = 'أ'.repeat(101);
      const result = captureSchema.safeParse({ name: longName });
      expect(result.success).toBe(false);
    });

    it('accepts name of exactly 100 characters', () => {
      const boundaryName = 'أ'.repeat(100);
      const result = captureSchema.safeParse({ name: boundaryName });
      expect(result.success).toBe(true);
    });
  });

  describe('Customer nested object validation', () => {
    it('accepts valid nested customer object', () => {
      const result = captureSchema.safeParse({
        customer: {
          name: 'سارة خالد',
          phone: '0555555555',
          role: 'باريستا المستقبل',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty customer.name', () => {
      const result = captureSchema.safeParse({
        customer: { name: '' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects customer.phone under 4 characters', () => {
      const result = captureSchema.safeParse({
        customer: { phone: '123' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Caption length edge cases', () => {
    it('accepts null caption', () => {
      const result = captureSchema.safeParse({ caption: null });
      expect(result.success).toBe(true);
    });

    it('accepts caption of exactly 280 characters', () => {
      const caption280 = 'ق'.repeat(280);
      const result = captureSchema.safeParse({ caption: caption280 });
      expect(result.success).toBe(true);
    });

    it('rejects caption exceeding 280 characters', () => {
      const caption281 = 'ق'.repeat(281);
      const result = captureSchema.safeParse({ caption: caption281 });
      expect(result.success).toBe(false);
    });
  });

  describe('Phone number validation edge cases', () => {
    it('rejects phone numbers shorter than 4 characters', () => {
      const result = captureSchema.safeParse({ phone: '123' });
      expect(result.success).toBe(false);
    });

    it('accepts phone number with minimum 4 characters', () => {
      const result = captureSchema.safeParse({ phone: '1234' });
      expect(result.success).toBe(true);
    });

    it('accepts phone number up to 30 characters', () => {
      const phone30 = '1'.repeat(30);
      const result = captureSchema.safeParse({ phone: phone30 });
      expect(result.success).toBe(true);
    });

    it('rejects phone numbers longer than 30 characters', () => {
      const phone31 = '1'.repeat(31);
      const result = captureSchema.safeParse({ phone: phone31 });
      expect(result.success).toBe(false);
    });
  });

  describe('UUID edge cases', () => {
    it('rejects non-UUID organizationId and branchId', () => {
      expect(captureSchema.safeParse({ organizationId: 'not-a-uuid' }).success).toBe(false);
      expect(captureSchema.safeParse({ branchId: '123-abc' }).success).toBe(false);
    });

    it('accepts valid UUIDs', () => {
      expect(
        captureSchema.safeParse({
          organizationId: validOrgId,
          branchId: validBranchId,
        }).success
      ).toBe(true);
    });
  });
});

describe('API Route: POST /api/v1/photobooth/capture', () => {
  const orgId = '123e4567-e89b-42d3-a456-426614174000';
  const branchId = '987fcdeb-51a2-43f7-9876-543210987654';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('successfully captures photo, normalizes Arabic phone, and creates new customer', async () => {
    const rawArabicPhone = '٠٥٠١٢٣٤٥٦٧';
    const expectedNormalizedPhone = '0501234567';

    mockAdminFrom.mockImplementation(
      mockSupabaseTables({
        organizations: { data: { id: orgId } },
        branches: { data: { id: branchId, organization_id: orgId } },
        customers: [
          // 1. Customer lookup by normalized anonymous_id (not found)
          { data: null, error: null },
          // 2. Customer insert
          {
            data: {
              id: 'cust-uuid-1',
              display_name: 'أحمد التميمي',
              anonymous_id: expectedNormalizedPhone,
              email: 'زائر ومحب للقهوة@persona.memories',
              created_at: '2026-09-21T18:00:00.000Z',
            },
            error: null,
          },
        ],
        visits: [
          // 1. Visit insert
          {
            data: {
              id: 'visit-uuid-1',
              created_at: '2026-09-21T18:00:00.000Z',
            },
            error: null,
          },
          // 2. Count query
          { data: null, error: null, count: 1 },
        ],
        memories: {
          data: {
            id: 'mem-uuid-1',
            status: 'approved',
            visibility: 'live_wall',
            caption: 'أحلى فلات وايت',
            created_at: '2026-09-21T18:00:00.000Z',
          },
          error: null,
        },
      })
    );

    const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify({
        name: 'أحمد التميمي',
        phone: rawArabicPhone,
        originalUrl: 'https://example.com/photo.jpg',
        caption: 'أحلى فلات وايت',
        organizationId: orgId,
        branchId: branchId,
        liveWallConsent: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.customer.name).toBe('أحمد التميمي');
    expect(json.customer.phone).toBe(expectedNormalizedPhone);
    expect(json.visit.id).toBe('visit-uuid-1');
    expect(json.memory.id).toBe('mem-uuid-1');
    expect(json.memory.visibility).toBe('live_wall');
    expect(json.freeGift.code).toMatch(/^GIFT-\d{4}$/);
  });

  it('updates an existing customer profile when customer is already registered', async () => {
    mockAdminFrom.mockImplementation(
      mockSupabaseTables({
        organizations: { data: { id: orgId } },
        branches: { data: { id: branchId, organization_id: orgId } },
        customers: [
          // 1. Existing customer found
          {
            data: {
              id: 'cust-uuid-existing',
              display_name: 'الاسم القديم',
              anonymous_id: '0509998877',
              email: 'old@persona.memories',
              created_at: '2026-09-20T10:00:00.000Z',
            },
            error: null,
          },
          // 2. Updated customer returned
          {
            data: {
              id: 'cust-uuid-existing',
              display_name: 'ريم القحطاني',
              anonymous_id: '0509998877',
              email: 'عاشق كيمكس@persona.memories',
              created_at: '2026-09-20T10:00:00.000Z',
            },
            error: null,
          },
        ],
        visits: [
          { data: { id: 'visit-uuid-2', created_at: '2026-09-21T18:00:00.000Z' }, error: null },
          { data: null, error: null, count: 4 },
        ],
        memories: {
          data: {
            id: 'mem-uuid-2',
            status: 'approved',
            visibility: 'private',
            caption: 'قهوة مميزة',
            created_at: '2026-09-21T18:00:00.000Z',
          },
          error: null,
        },
      })
    );

    const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify({
        name: 'ريم القحطاني',
        phone: '0509998877',
        role: 'عاشق كيمكس',
        originalUrl: 'https://example.com/v60.jpg',
        organizationId: orgId,
        branchId: branchId,
        liveWallConsent: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.customer.id).toBe('cust-uuid-existing');
    expect(json.customer.name).toBe('ريم القحطاني');
    expect(json.customer.visitsCount).toBe(4);
    expect(json.memory.visibility).toBe('private');
  });

  it('resolves branch and organization via cafeSlug when IDs are omitted', async () => {
    mockAdminFrom.mockImplementation(
      mockSupabaseTables({
        branches: { data: { id: branchId, organization_id: orgId } },
        customers: [
          { data: null, error: null },
          {
            data: {
              id: 'cust-slug-1',
              display_name: 'زائر مميز',
              anonymous_id: '01000000000',
              created_at: '2026-09-21T18:00:00.000Z',
            },
            error: null,
          },
        ],
        visits: [
          { data: { id: 'visit-slug-1', created_at: '2026-09-21T18:00:00.000Z' }, error: null },
          { data: null, error: null, count: 1 },
        ],
      })
    );

    const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify({
        cafeSlug: 'espresso-lab',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.customer.name).toBe('زائر مميز');
  });

  it('rejects invalid payload with status 400 when validation fails', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify({
        caption: 'X'.repeat(300), // Exceeds 280 characters
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid payload');
    expect(json.details).toBeDefined();
  });

  it('returns 500 when Supabase customer insert fails', async () => {
    mockAdminFrom.mockImplementation(
      mockSupabaseTables({
        organizations: { data: { id: orgId } },
        branches: { data: { id: branchId, organization_id: orgId } },
        customers: [
          { data: null, error: null },
          { data: null, error: { message: 'Database connection failed' } },
        ],
      })
    );

    const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify({
        name: 'عميل جديد',
        phone: '0501112233',
        organizationId: orgId,
        branchId: branchId,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('Failed to create customer profile');
    expect(json.details).toBe('Database connection failed');
  });
});

describe('API Route: GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 with healthy status when database check succeeds', async () => {
    mockServerFrom.mockImplementation(() =>
      createMockQueryBuilder({ data: [{ id: '11111111-1111-1111-1111-111111111111' }], error: null })
    );

    const response = await healthGET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.version).toBe('2.0.0');
    expect(json.checks.database.status).toBe('healthy');
    expect(typeof json.checks.database.latencyMs).toBe('number');
    expect(typeof json.totalLatencyMs).toBe('number');
  });

  it('returns 503 with degraded status when database query returns error', async () => {
    mockServerFrom.mockImplementation(() =>
      createMockQueryBuilder({ data: null, error: { message: 'Supabase table not reachable' } })
    );

    const response = await healthGET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.checks.database.status).toBe('degraded');
  });

  it('returns 503 with degraded status when database call throws an exception', async () => {
    mockServerFrom.mockImplementation(() => {
      throw new Error('Network socket disconnected');
    });

    const response = await healthGET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.checks.database.status).toBe('degraded');
  });
});
