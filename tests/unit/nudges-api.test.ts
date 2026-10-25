import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/merchant/nudges/route';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

const mockRequireOperator = vi.fn();
const mockMessagingAvailable = vi.fn();
const mockProcessBatch = vi.fn();
const mockAudit = vi.fn();

vi.mock('@/lib/server/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/context')>();
  return {
    ...actual,
    requireOperator: (...args: unknown[]) => mockRequireOperator(...args),
  };
});

vi.mock('@/lib/server/wallet-service', () => ({
  walletMessagingAvailable: (...args: unknown[]) => mockMessagingAvailable(...args),
}));

vi.mock('@/lib/server/wallet-campaigns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/wallet-campaigns')>();
  return {
    ...actual,
    processWalletCampaignBatch: (...args: unknown[]) => mockProcessBatch(...args),
  };
});

vi.mock('@/lib/server/route-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/route-helpers')>();
  return { ...actual, writeAuditLog: (...args: unknown[]) => mockAudit(...args) };
});

const inserted: unknown[] = [];

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: (payload: unknown) => {
        inserted.push(payload);
        return {
          select: () => ({
            single: async () => ({ data: { id: 'campaign-1' }, error: null }),
          }),
        };
      },
    }),
  }),
}));

const operator = {
  source: 'merchant' as const,
  memberId: 'member-1',
  userId: 'user-1',
  email: 'owner@example.com',
  role: 'owner' as const,
  organization: { id: ORG_ID, slug: 'cafe', name: 'Café', status: 'active', settings: {} },
  branchId: null,
};

function nudgeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/v1/merchant/nudges', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/v1/merchant/nudges plan gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inserted.length = 0;
    mockRequireOperator.mockResolvedValue({ context: operator, error: null });
    mockProcessBatch.mockResolvedValue({ claimed: 0, accepted: 0, unknown: 0 });
  });

  it('refuses to create a campaign when the wallet plan has no message field', async () => {
    mockMessagingAvailable.mockResolvedValue(false);

    const response = await POST(
      nudgeRequest({ audience: 'reward_ready', message: 'مكافأتك جاهزة عند الكاشير' })
    );

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('plan_required');
    expect(inserted).toHaveLength(0);
    expect(mockProcessBatch).not.toHaveBeenCalled();
  });

  it('creates and processes the campaign when the plan supports messaging', async () => {
    mockMessagingAvailable.mockResolvedValue(true);

    const response = await POST(
      nudgeRequest({ audience: 'reward_ready', message: 'مكافأتك جاهزة عند الكاشير' })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.campaignId).toBe('campaign-1');
    expect(inserted).toHaveLength(1);
    expect(mockProcessBatch).toHaveBeenCalledWith(
      'campaign-1',
      expect.objectContaining({ channel: 'wallet', audience: 'reward_ready' })
    );
  });
});
