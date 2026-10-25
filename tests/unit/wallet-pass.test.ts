import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { safeSiteOrigin, walletPassPayload, type WalletPassInput } from '@/lib/wallet-pass';
import type { PublicBrand } from '@/lib/brand';

const brand: PublicBrand = {
  name: 'Demo Café',
  tagline: null,
  primaryColor: '#682025',
  accentColor: '#DFAB56',
  frameStyle: 'film',
  walletColorPreset: 'red',
  logoUrl: null,
  socialLinks: {},
};

const baseInput: WalletPassInput = {
  organizationId: '11111111-1111-1111-1111-111111111111',
  organizationSlug: 'demo',
  customerId: '22222222-2222-2222-2222-222222222222',
  brand,
  verifiedVisits: 3,
  usedVisits: 0,
  threshold: 5,
  rewardName: 'قهوة مجانية',
  marketingOptIn: false,
  nearbyOptIn: false,
  lastCampaignMessage: ' ',
  plan: 'free',
  verifiedAt: null,
  siteOrigin: 'https://memories.example.com',
  branches: [],
};

describe('walletPassPayload', () => {
  it('uses the customer id as the barcode and never exposes a phone or email', () => {
    const payload = walletPassPayload(baseInput);
    expect(payload.barcodeFormat).toBe('QR');
    expect(payload.barcodeValue).toBe(baseInput.customerId);
    expect(payload.sharingProhibited).toBe(true);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('phone');
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain('01055512345');
  });

  it('derives stamps from verified visits minus redeemed visits, capped at the threshold', () => {
    expect(walletPassPayload(baseInput).secondaryFields[0].value).toBe('3/5');
    expect(
      walletPassPayload({ ...baseInput, verifiedVisits: 9, usedVisits: 2 }).secondaryFields[0].value
    ).toBe('5/5');
    expect(
      walletPassPayload({ ...baseInput, verifiedVisits: 1, usedVisits: 4 }).secondaryFields[0].value
    ).toBe('0/5');
  });

  it('shows a setup state when no active reward rule exists', () => {
    const payload = walletPassPayload({ ...baseInput, threshold: null, rewardName: null });
    expect(payload.secondaryFields[0].value).toBe('البرنامج قيد الإعداد');
    expect(payload.secondaryFields[1].value).toBe('قيد الإعداد');
  });

  it('keeps custom colours, logos and locations off the free plan', () => {
    const payload = walletPassPayload({
      ...baseInput,
      brand: { ...brand, logoUrl: '/api/v1/brand/1/logo?v=abc' },
      plan: 'free',
      nearbyOptIn: true,
      branches: [{ latitude: 24.7, longitude: 46.6 }],
    });
    expect(payload.color).toBeUndefined();
    expect(payload.logoURL).toBeUndefined();
    expect(payload.locations).toBeUndefined();
    expect(payload.colorPreset).toBe('red');
  });

  it('adds verified Pro branding and locations', () => {
    const payload = walletPassPayload({
      ...baseInput,
      brand: { ...brand, logoUrl: '/api/v1/brand/1/logo?v=abc' },
      plan: 'pro',
      verifiedAt: new Date().toISOString(),
      nearbyOptIn: true,
      branches: [{ latitude: 24.7, longitude: 46.6 }],
    });
    expect(payload.color).toBe('#682025');
    expect(payload.logoURL).toContain('/api/v1/brand/11111111-1111-1111-1111-111111111111/wallet-mark');
    expect(payload.locations).toHaveLength(1);
  });

  it('ignores invalid coordinates and more than ten branches', () => {
    const payload = walletPassPayload({
      ...baseInput,
      plan: 'business',
      verifiedAt: new Date().toISOString(),
      nearbyOptIn: true,
      branches: [
        { latitude: 200, longitude: 46.6 },
        ...Array.from({ length: 12 }, () => ({ latitude: 24.7, longitude: 46.6 })),
      ],
    });
    expect(payload.locations).toHaveLength(10);
  });
});

describe('safeSiteOrigin', () => {
  it('accepts a clean https origin', () => {
    expect(safeSiteOrigin('https://memories.example.com')).toBe('https://memories.example.com');
  });

  it('rejects non-https, ports, paths, credentials and local hosts', () => {
    expect(safeSiteOrigin('http://memories.example.com')).toBeNull();
    expect(safeSiteOrigin('https://memories.example.com:8443')).toBeNull();
    expect(safeSiteOrigin('https://user:pass@memories.example.com')).toBeNull();
    expect(safeSiteOrigin('https://memories.example.com/path')).toBeNull();
    expect(safeSiteOrigin('https://localhost')).toBeNull();
    expect(safeSiteOrigin('https://memories.test')).toBeNull();
    expect(safeSiteOrigin('not-a-url')).toBeNull();
  });
});

const mockReadCustomerSession = vi.fn();
const mockLoadPublicVenue = vi.fn();
const mockIssuePlatformWalletPass = vi.fn();
const mockCustomerRows = vi.fn();

vi.mock('@/lib/customer-session', () => ({
  readCustomerSession: (...args: unknown[]) => mockReadCustomerSession(...args),
}));

vi.mock('@/lib/server/public-venue', () => ({
  loadPublicVenue: (...args: unknown[]) => mockLoadPublicVenue(...args),
}));

vi.mock('@/lib/server/wallet-service', () => ({
  issuePlatformWalletPass: (...args: unknown[]) => mockIssuePlatformWalletPass(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        in: () => ({ is: mockCustomerRows }),
      }),
    }),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  consumeRateLimit: vi.fn(async () => ({
    allowed: true,
    limit: 10,
    remaining: 9,
    resetAt: Date.now() + 60_000,
  })),
  rateLimitKey: vi.fn(() => 'wallet-pass:test'),
  rateLimitResponse: vi.fn(),
}));

import { GET } from '@/app/api/v1/wallet/pass/route';

const orgId = '11111111-1111-1111-1111-111111111111';

function requestFor(query: string) {
  return new NextRequest(`http://localhost/api/v1/wallet/pass?${query}`);
}

describe('GET /api/v1/wallet/pass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadCustomerSession.mockResolvedValue({
      customerId: baseInput.customerId,
      customerIds: [baseInput.customerId],
    });
    mockLoadPublicVenue.mockResolvedValue({
      organization: { id: orgId },
      branch: { id: '33333333-3333-3333-3333-333333333333' },
    });
    mockCustomerRows.mockResolvedValue({
      data: [{ id: baseInput.customerId, organization_id: orgId }],
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('answers 401 without a signed customer session', async () => {
    mockReadCustomerSession.mockResolvedValue(null);
    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('unauthenticated');
  });

  it('answers 400 when cafeSlug is missing', async () => {
    const res = await GET(requestFor(''));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('cafe_slug_required');
  });

  it('answers 404 when the venue does not exist', async () => {
    mockLoadPublicVenue.mockResolvedValue(null);
    const res = await GET(requestFor('cafeSlug=missing'));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.code).toBe('venue_not_found');
  });

  it('answers 403 when the customer belongs to another organization', async () => {
    mockCustomerRows.mockResolvedValue({
      data: [
        { id: baseInput.customerId, organization_id: '99999999-9999-9999-9999-999999999999' },
      ],
      error: null,
    });
    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('customer_scope');
  });

  it('finds the venue card even when another card is the active one', async () => {
    const otherCard = '44444444-4444-4444-8444-444444444444';
    mockReadCustomerSession.mockResolvedValue({
      customerId: otherCard,
      customerIds: [otherCard, baseInput.customerId],
    });
    mockCustomerRows.mockResolvedValue({
      data: [
        { id: otherCard, organization_id: '99999999-9999-9999-9999-999999999999' },
        { id: baseInput.customerId, organization_id: orgId },
      ],
      error: null,
    });
    mockIssuePlatformWalletPass.mockResolvedValue({
      id: 'pass-1',
      serialNumber: 'sn-123',
      shareUrl: 'https://api.walletwallet.dev/p/sn-123',
      reused: true,
    });

    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(200);
    expect(mockIssuePlatformWalletPass).toHaveBeenCalledWith(orgId, baseInput.customerId);
  });

  it('returns the provider install URL without exposing the API key', async () => {
    mockIssuePlatformWalletPass.mockResolvedValue({
      id: 'pass-1',
      serialNumber: 'sn-123',
      shareUrl: 'https://api.walletwallet.dev/p/sn-123',
      reused: false,
    });

    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.serialNumber).toBe('sn-123');
    expect(json.shareUrl).toBe('https://api.walletwallet.dev/p/sn-123');
    expect(json.reused).toBe(false);
    expect(JSON.stringify(json)).not.toContain('ww_live');
    expect(mockIssuePlatformWalletPass).toHaveBeenCalledWith(orgId, baseInput.customerId);
  });

  it('answers 503 when the wallet is not configured', async () => {
    mockIssuePlatformWalletPass.mockRejectedValue(new Error('WALLETWALLET_API_KEY is not configured'));
    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('wallet_unavailable');
  });

  it('answers 429 when the provider quota is exhausted', async () => {
    mockIssuePlatformWalletPass.mockRejectedValue(new Error('walletwallet issue failed (429): quota'));
    const res = await GET(requestFor('cafeSlug=demo'));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.code).toBe('wallet_quota');
  });
});
