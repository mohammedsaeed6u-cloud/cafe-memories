import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as onboard } from '@/app/api/v1/merchant/onboard/route';
import { GET as callback } from '@/app/auth/callback/route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), exchange: vi.fn() }));
vi.mock('@/lib/server/context', async () => {
  const { NextResponse } = await import('next/server');
  return { apiError: (message: string, status: number) => NextResponse.json({ error: message }, { status }) };
});
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser, exchangeCodeForSession: mocks.exchange },
  rpc: mocks.rpc,
}) }));
const user = { id: 'a1923b57-3665-4cdc-b4ac-0075771c86df', email: 'owner@example.com',
  user_metadata: { cafe_name: 'بيت القهوة', cafe_slug: 'coffee-house' } };
const request = (body: object) => new NextRequest('https://example.test/api/v1/merchant/onboard', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: '123e4567-e89b-42d3-a456-426614174000', error: null });
});

describe('real merchant registration lifecycle', () => {
  it('creates a business only after a verified Supabase session, never with demo data', async () => {
    const response = await onboard(request({ name: 'بيت القهوة', slug: 'coffee-house' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ organizationId: '123e4567-e89b-42d3-a456-426614174000' });
    expect(mocks.rpc).toHaveBeenCalledWith('provision_merchant', {
      p_name: 'بيت القهوة', p_slug: 'coffee-house',
    });
  });
  it('rejects malformed input and unauthenticated users without provisioning', async () => {
    expect((await onboard(request({ name: 'x', slug: 'invalid slug' }))).status).toBe(400);
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await onboard(request({ name: 'بيت القهوة', slug: 'coffee-house' }))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('converts an already-used business slug to a conflict rather than a phantom account', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
    expect((await onboard(request({ name: 'بيت القهوة', slug: 'coffee-house' }))).status).toBe(409);
  });
  it('exchanges the confirmation code and provisions the merchant before dashboard redirect', async () => {
    const response = await callback(new NextRequest('https://example.test/auth/callback?code=real-code'));
    expect(mocks.exchange).toHaveBeenCalledWith('real-code');
    expect(mocks.rpc).toHaveBeenCalledWith('provision_merchant', {
      p_name: 'بيت القهوة', p_slug: 'coffee-house',
    });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.test/dashboard');
  });
  it('never provisions when the confirmation code is missing or rejected', async () => {
    const missing = await callback(new NextRequest('https://example.test/auth/callback'));
    expect(missing.headers.get('location')).toContain('/login?error=missing-code');
    mocks.exchange.mockResolvedValue({ error: new Error('expired') });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const rejected = await callback(new NextRequest('https://example.test/auth/callback?code=expired'));
      expect(rejected.headers.get('location')).toContain('/login?error=setup-failed');
      expect(mocks.rpc).not.toHaveBeenCalled();
    } finally { logged.mockRestore(); }
  });
});
