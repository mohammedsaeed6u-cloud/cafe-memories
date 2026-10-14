import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as deprecatedCapture } from '@/app/api/v1/photobooth/capture/route';
import { POST as legacyMemoryPost } from '@/app/api/v1/memories/route';
import { GET as walletPass } from '@/app/api/v1/wallet/pass/route';
import { POST as visitPost } from '@/app/api/v1/visits/route';
import { POST as redeemPost } from '@/app/api/v1/rewards/redeem/route';
import { POST as consentPost } from '@/app/api/v1/memories/consent/route';
import { GET as qrGet } from '@/app/api/v1/qr/[slug]/route';

const mocks = vi.hoisted(() => ({ merchant: vi.fn(), customer: vi.fn(), rpc: vi.fn(), walletSync: vi.fn() }));
vi.mock('@/lib/server/wallet-service', () => ({ syncCustomerWalletAfterTransaction: mocks.walletSync }));
vi.mock('@/lib/server/context', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/server/context')>();
  return { ...actual, requireMerchant: mocks.merchant, requireCustomer: mocks.customer };
});
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));

const customerId = '54b83319-a10f-4a2d-8038-cd21a2237eb4';
const branchId = 'eaab6418-7985-405d-b3df-98642245213b';
const ruleId = '0f766bd3-bf73-4eb0-ae2f-951c951eea4c';
const idempotencyKey = 'e6464d52-9307-4023-b0c0-499d692c7a5f';
const post = (url: string, body: object) => new NextRequest(`https://example.test${url}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.merchant.mockResolvedValue({ context: { db: { rpc: mocks.rpc }, membership: {
    organizationId: '1d276cd9-81ab-46c1-a1cb-796a4a065bb9', branchId, role: 'staff',
  } } });
  mocks.customer.mockResolvedValue({ context: { db: { rpc: mocks.rpc }, customerId } });
  mocks.rpc.mockResolvedValue({ data: { visitId: 'safe-id', replayed: false }, error: null });
  mocks.walletSync.mockResolvedValue('not-issued');
});

describe('public legacy operations fail closed', () => {
  it('does not mint visits by phone/caller-controlled customer IDs', async () => {
    const response = await deprecatedCapture(post('/api/v1/photobooth/capture', { phone: '0501111111', organizationId: branchId }));
    expect(response.status).toBe(410);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('disallows untrusted JSON image URLs and forged wallet passes', async () => {
    expect((await legacyMemoryPost()).status).toBe(410);
    expect((await walletPass()).status).toBe(501);
  });
});

describe('merchant-only transactional operations', () => {
  it('validates the visit input before making an authorization query', async () => {
    const response = await visitPost(post('/api/v1/visits', { customerId: 'not-a-uuid' }));
    expect(response.status).toBe(400);
    expect(mocks.merchant).not.toHaveBeenCalled();
  });
  it('does not call the DB RPC when merchant authorization is denied', async () => {
    mocks.merchant.mockResolvedValueOnce({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
    const response = await visitPost(post('/api/v1/visits', { customerId, branchId, idempotencyKey }));
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('binds branch and customer to a single authorized visit RPC', async () => {
    const response = await visitPost(post('/api/v1/visits', { customerId, branchId, idempotencyKey }));
    expect(response.status).toBe(200);
    expect(mocks.merchant).toHaveBeenCalledWith({ branchId });
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_visit', {
      p_customer_id: customerId, p_branch_id: branchId, p_idempotency_key: idempotencyKey,
    });
  });
  it('maps insufficient balance to a conflict, not a success response', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23514' } });
    const response = await redeemPost(post('/api/v1/rewards/redeem', {
      customerId, branchId, rewardRuleId: ruleId, idempotencyKey,
    }));
    expect(response.status).toBe(409);
    expect(mocks.rpc).toHaveBeenCalledWith('redeem_customer_reward', {
      p_customer_id: customerId, p_branch_id: branchId,
      p_reward_rule_id: ruleId, p_idempotency_key: idempotencyKey,
    });
  });
});

describe('guest consent and QR resolution', () => {
  it('will not mutate another guest’s memory after an ownership rejection', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    const response = await consentPost(post('/api/v1/memories/consent', {
      memoryId: customerId, liveWallConsent: false,
    }));
    expect(response.status).toBe(403);
    expect(mocks.rpc).toHaveBeenCalledWith('set_customer_wall_consent', {
      p_memory_id: customerId, p_consent: false,
    });
  });
  it('resolves only a DB-backed QR slug with a server-side atomic scan', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ qr_id: customerId, org_slug: 'alpha', branch_slug: 'main', qr_source: 'table' }], error: null });
    const response = await qrGet(new NextRequest('https://example.test/api/v1/qr/qr-safe'), { params: Promise.resolve({ slug: 'qr-safe' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).destinationUrl).toBe('/c/alpha?branch=main&ref=qr-safe');
    expect(mocks.rpc).toHaveBeenCalledWith('record_qr_scan', { p_slug: 'qr-safe' });
  });
});
