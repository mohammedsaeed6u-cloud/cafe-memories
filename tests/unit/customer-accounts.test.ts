import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { customerGoogleAction } from '@/lib/customer-google-flow';
import { PATCH as saveAccount } from '@/app/api/v1/customer/account/route';
import { POST as linkIntent } from '@/app/api/v1/customer/oauth/link-intent/route';
import { GET as customerCallback } from '@/app/auth/customer/callback/route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), exchange: vi.fn(), rpc: vi.fn(), requireCustomer: vi.fn() }));
vi.mock('@/lib/server/context', () => ({
  apiError: (message: string, status: number) => NextResponse.json({ error: message }, { status }),
  requireCustomer: mocks.requireCustomer,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser, exchangeCodeForSession: mocks.exchange },
}) }));

const userId = 'b7ce94b1-e9d7-40c1-8886-2b0376494942';
const anotherId = '8c698c4c-43a9-4a84-96f6-03586b9f5dcf';
const destination = 'https://example.test/c/coffee-house?branch=main';
const callback = (suffix: string, cookie?: string) => new NextRequest(
  `https://example.test/auth/customer/callback?cafe=coffee-house&branch=main${suffix}`,
  cookie ? { headers: { Cookie: cookie.split(';')[0] } } : undefined,
);
const patch = (body: object) => new NextRequest('https://example.test/api/v1/customer/account', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ authUserId: userId, ...body }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCustomer.mockResolvedValue({ context: { userId, customerId: anotherId, db: { rpc: mocks.rpc } } });
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId, email: 'guest@gmail.com', is_anonymous: false } }, error: null });
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('customer settings stay owned by the authenticated guest', () => {
  it('validates the display name and contact number before authorization, with no identity fields', async () => {
    expect((await saveAccount(patch({ displayName: 'X', phone: null }))).status).toBe(400);
    expect((await saveAccount(patch({ displayName: 'أحمد', phone: 'bad number' }))).status).toBe(400);
    expect((await saveAccount(patch({ displayName: 'أحمد', phone: null, role: 'admin' }))).status).toBe(400);
    expect(mocks.requireCustomer).not.toHaveBeenCalled();
  });
  it('saves the owner’s profile through a self-scoped RPC, not a direct customer UPDATE', async () => {
    const response = await saveAccount(patch({ displayName: ' أحمد ', phone: '+201001234567' }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('set_customer_account', {
      p_display_name: 'أحمد', p_phone: '+201001234567',
    });
  });
  it('rejects unauthenticated settings and returns errors rather than pretending they were saved', async () => {
    mocks.requireCustomer.mockResolvedValue({ error: NextResponse.json({ error: 'Sign in' }, { status: 401 }) });
    expect((await saveAccount(patch({ displayName: 'أحمد', phone: null }))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.requireCustomer.mockResolvedValue({ context: { userId, db: { rpc: mocks.rpc } } });
    expect((await saveAccount(patch({ authUserId: anotherId, displayName: 'أحمد', phone: null }))).status).toBe(409);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({ error: { code: '42501' } });
    expect((await saveAccount(patch({ displayName: 'أحمد', phone: null }))).status).toBe(403);
  });
});

describe('separate customer Google callback and anonymous history protection', () => {
  it('signs in only without a session; any existing account always links to preserve its identity', () => {
    expect(customerGoogleAction(null)).toBe('sign-in');
    expect(customerGoogleAction({ googleLinked: false })).toBe('link');
    expect(customerGoogleAction({ googleLinked: true })).toBe('already-linked');
  });
  it('exchanges a customer OAuth code and redirects only to its validated venue, without merchant setup', async () => {
    const response = await customerCallback(callback('&code=google-code'));
    expect(mocks.exchange).toHaveBeenCalledWith('google-code');
    expect(response.headers.get('location')).toBe(destination);
    expect(mocks.rpc).not.toHaveBeenCalled();
    const untrusted = await customerCallback(new NextRequest(
      'https://example.test/auth/customer/callback?cafe=../../evil&branch=main&next=https://evil.test&code=x'));
    expect(untrusted.headers.get('location')).toBe('https://example.test/');
    expect(mocks.exchange).toHaveBeenCalledTimes(1);
  });
  it('binds a link to the original Supabase user ID, and refuses a changed identity', async () => {
    const intent = await linkIntent(new NextRequest('https://example.test/api/v1/customer/oauth/link-intent', {
      method: 'POST', headers: { Origin: 'https://example.test' },
    }));
    const { nonce } = await intent.json();
    const cookie = intent.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/auth/customer/callback');
    const success = await customerCallback(callback(`&flow=link&nonce=${nonce}&code=link-code`, cookie));
    expect(success.headers.get('location')).toBe(destination);
    const stripped = await customerCallback(callback('&code=link-without-flow', cookie));
    expect(stripped.headers.get('location')).toContain('auth_error=link-failed');
    expect(mocks.exchange).toHaveBeenCalledTimes(1); // no exchange that could replace the guest
    mocks.getUser.mockResolvedValue({ data: { user: { id: anotherId, is_anonymous: false } }, error: null });
    const changed = await customerCallback(callback(`&flow=link&nonce=${nonce}&code=link-code`, cookie));
    expect(changed.headers.get('location')).toBe(`${destination}&auth_error=identity-mismatch`);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('never exchanges a link without its intent, or on an invalid/denied OAuth callback', async () => {
    const missingIntent = await customerCallback(callback('&flow=link&nonce=bad&code=code'));
    expect(missingIntent.headers.get('location')).toContain('auth_error=link-failed');
    const denied = await customerCallback(callback('&error=access_denied'));
    expect(denied.headers.get('location')).toContain('auth_error=sign-in-failed');
    const missingCode = await customerCallback(callback(''));
    expect(missingCode.headers.get('location')).toContain('auth_error=missing-code');
    expect(mocks.exchange).not.toHaveBeenCalled();
    const origin = await linkIntent(new NextRequest('https://example.test/api/v1/customer/oauth/link-intent', {
      method: 'POST', headers: { Origin: 'https://foreign.test' },
    }));
    expect(origin.status).toBe(403);
    expect(mocks.requireCustomer).not.toHaveBeenCalled();
  });
});
