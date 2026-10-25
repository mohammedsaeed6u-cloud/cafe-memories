import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, normalizePhoneNumber, captureSchema } from '@/app/api/v1/photobooth/capture/route';
import { GET as healthGET } from '@/app/api/health/route';

const ORG_ID = '123e4567-e89b-42d3-a456-426614174000';
const BRANCH_ID = '987fcdeb-51a2-43f7-9876-543210987654';
const CUSTOMER_ID = '22222222-2222-4222-8222-222222222222';
const IDEMPOTENCY_KEY = '33333333-3333-4333-8333-333333333333';

const mockReadCustomerSession = vi.fn();
const mockLoadPublicVenue = vi.fn();
const mockRpc = vi.fn();
const mockMaybeSingle = vi.fn();
const mockAuditInsert = vi.fn();
const mockServerFrom = vi.fn();

vi.mock('@/lib/customer-session', () => ({
  readCustomerSession: (...args: unknown[]) => mockReadCustomerSession(...args),
}));

vi.mock('@/lib/server/public-venue', () => ({
  loadPublicVenue: (...args: unknown[]) => mockLoadPublicVenue(...args),
}));

vi.mock('@/lib/server/memory-urls', () => ({
  signedMemoryUrl: vi.fn(async (key: string) => `https://signed.example/${key}`),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'audit_logs') {
        return { insert: mockAuditInsert };
      }
      return {
        select: () => ({
          eq: () => ({
            is: () => ({ maybeSingle: mockMaybeSingle }),
          }),
        }),
      };
    },
    rpc: mockRpc,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockServerFrom,
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  consumeRateLimit: vi.fn(async () => ({
    allowed: true,
    limit: 12,
    remaining: 11,
    resetAt: Date.now() + 3_600_000,
  })),
  rateLimitKey: vi.fn(() => 'photobooth-capture:test'),
  rateLimitResponse: vi.fn(),
}));

function createMockQueryBuilder(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const queryResult = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };

  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    order: vi.fn(() => builder),
    in: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => queryResult),
    single: vi.fn(async () => queryResult),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(queryResult).then(resolve, reject),
  };

  return builder;
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
  it('requires a venue slug and an idempotency key', () => {
    expect(captureSchema.safeParse({}).success).toBe(false);
    expect(captureSchema.safeParse({ cafeSlug: 'demo' }).success).toBe(false);
    expect(
      captureSchema.safeParse({ cafeSlug: 'demo', idempotencyKey: IDEMPOTENCY_KEY }).success
    ).toBe(true);
  });

  it('defaults every consent flag to false', () => {
    const result = captureSchema.safeParse({
      cafeSlug: 'espresso-lab',
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.liveWallConsent).toBe(false);
      expect(result.data.socialShareConsent).toBe(false);
      expect(result.data.marketingConsent).toBe(false);
    }
  });

  it('accepts a fully populated payload with Arabic content', () => {
    const result = captureSchema.safeParse({
      cafeSlug: 'espresso-lab',
      caption: 'أجمل قهوة صباحية في الرياض ☕️',
      storageKey: `${ORG_ID}/memories/photo.webp`,
      liveWallConsent: true,
      socialShareConsent: true,
      marketingConsent: true,
      deviceFingerprint: 'device-abc',
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsafe storage keys and accepts tenant-scoped keys', () => {
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        storageKey: '../escape.webp',
      }).success
    ).toBe(false);
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        storageKey: '/absolute.webp',
      }).success
    ).toBe(false);
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        storageKey: `${ORG_ID}/memories/photo.webp`,
      }).success
    ).toBe(true);
  });

  it('enforces the caption boundary at 280 characters', () => {
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        caption: null,
      }).success
    ).toBe(true);
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        caption: 'ق'.repeat(280),
      }).success
    ).toBe(true);
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        caption: 'ق'.repeat(281),
      }).success
    ).toBe(false);
  });

  it('rejects invalid UUIDs and overlong legacy phone fields', () => {
    expect(
      captureSchema.safeParse({ cafeSlug: 'demo', idempotencyKey: 'not-a-uuid' }).success
    ).toBe(false);
    expect(
      captureSchema.safeParse({
        cafeSlug: 'demo',
        idempotencyKey: IDEMPOTENCY_KEY,
        phone: '1'.repeat(31),
      }).success
    ).toBe(false);
  });
});

describe('API Route: POST /api/v1/photobooth/capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadCustomerSession.mockResolvedValue({ customerId: CUSTOMER_ID });
    mockLoadPublicVenue.mockResolvedValue({
      organization: { id: ORG_ID },
      branch: { id: BRANCH_ID },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { id: CUSTOMER_ID, organization_id: ORG_ID },
      error: null,
    });
    mockAuditInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({
      data: {
        status: 'verified',
        duplicate: false,
        visit: { id: 'visit-1', created_at: '2026-10-25T10:00:00.000Z' },
        memory: {
          id: 'memory-1',
          status: 'approved',
          visibility: 'live_wall',
          caption: 'أحلى فلات وايت',
          created_at: '2026-10-25T10:00:00.000Z',
        },
        balance: { usedVisits: 1, availableRewards: 0, oldestRewardName: null },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function captureRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('answers 401 without a signed customer session', async () => {
    mockReadCustomerSession.mockResolvedValue(null);
    const response = await POST(
      captureRequest({ cafeSlug: 'demo', idempotencyKey: IDEMPOTENCY_KEY })
    );
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe('unauthenticated');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload with status 400', async () => {
    const response = await POST(captureRequest({ cafeSlug: 'demo' }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_payload');
  });

  it('records the memory for the session customer, never a body-supplied identity', async () => {
    const response = await POST(
      captureRequest({
        cafeSlug: 'espresso-lab',
        caption: 'أحلى فلات وايت',
        storageKey: `${ORG_ID}/memories/photo.webp`,
        liveWallConsent: true,
        idempotencyKey: IDEMPOTENCY_KEY,
        // Legacy identity fields must be ignored.
        customerId: '99999999-9999-4999-8999-999999999999',
        phone: '0501234567',
      })
    );

    expect(response.status, await response.clone().text()).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.duplicate).toBe(false);
    expect(json.visit.id).toBe('visit-1');
    expect(json.memory.id).toBe('memory-1');
    expect(json.memory.visibility).toBe('live_wall');
    expect(json.memory.imageUrl).toContain('https://signed.example/');

    expect(mockRpc).toHaveBeenCalledWith(
      'capture_guest_memory',
      expect.objectContaining({
        p_customer_id: CUSTOMER_ID,
        p_organization_id: ORG_ID,
        p_branch_id: BRANCH_ID,
        p_original_url: `${ORG_ID}/memories/photo.webp`,
        p_live_wall_consent: true,
        p_idempotency_key: IDEMPOTENCY_KEY,
      })
    );
  });

  it('answers 429 while the 60-minute visit cooldown is active', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'cooldown', cooldownMinutes: 42 },
      error: null,
    });
    const response = await POST(
      captureRequest({
        cafeSlug: 'demo',
        storageKey: `${ORG_ID}/memories/photo.webp`,
        idempotencyKey: IDEMPOTENCY_KEY,
      })
    );
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.code).toBe('visit_cooldown');
    expect(json.error).toContain('42');
  });

  it('answers 503 without leaking database details when the transaction fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'internal detail' } });
    const response = await POST(
      captureRequest({
        cafeSlug: 'demo',
        storageKey: `${ORG_ID}/memories/photo.webp`,
        idempotencyKey: IDEMPOTENCY_KEY,
      })
    );
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.code).toBe('capture_unavailable');
    expect(JSON.stringify(json)).not.toContain('internal detail');
  });
});

describe('API Route: GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
