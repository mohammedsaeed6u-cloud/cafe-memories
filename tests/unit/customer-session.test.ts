import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as startSession } from '@/app/api/v1/customer/session/route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), rpc: vi.fn(), resolveVenue: vi.fn(),
  customer: vi.fn(), inserted: vi.fn(), created: vi.fn(),
  settings: vi.fn(), visits: vi.fn(), memories: vi.fn(),
}));
const query = (result: () => Promise<unknown>, singleResult = result) => {
  const builder = {
    select: () => builder, eq: () => builder, is: () => builder, neq: () => builder,
    order: () => builder, limit: () => builder, insert: (value: unknown) => { mocks.inserted(value); return builder; },
    maybeSingle: result, single: singleResult,
    then: (fulfilled: (value: unknown) => unknown, rejected: (error: unknown) => unknown) =>
      result().then(fulfilled, rejected),
  };
  return builder;
};
vi.mock('@/lib/server/context', () => ({
  apiError: (message: string, status: number) => NextResponse.json({ error: message }, { status }),
  resolveVenue: mocks.resolveVenue,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc,
}) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({
  from: (table: string) => table === 'customers' ? query(mocks.customer, mocks.created) :
    table === 'customer_accounts' ? query(mocks.settings) :
      table === 'visits' ? query(mocks.visits) : query(mocks.memories),
}) }));

const userId = '21aaf6c7-5e17-4779-9231-2096ca9aeb30';
const customerId = 'a197b5a0-446c-474d-856a-d36341776e0e';
const branchId = 'beb54d03-9645-4cb5-92fb-9a35d2e0c8de';
const post = () => new NextRequest('https://example.test/api/v1/customer/session', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cafeSlug: 'coffee-house', branchSlug: 'main' }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveVenue.mockResolvedValue({ organizationId: userId, branchId, organizationName: 'Cafe', branchName: 'Main' });
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId, email: 'customer@gmail.com', is_anonymous: false,
    user_metadata: { full_name: 'زبونة دائمة' }, identities: [{ provider: 'google' }] } }, error: null });
  mocks.customer.mockResolvedValue({ data: { id: customerId, display_name: 'زبونة دائمة' }, error: null });
  mocks.created.mockResolvedValue({ data: { id: customerId, display_name: 'زبونة دائمة' }, error: null });
  mocks.settings.mockResolvedValue({ data: { phone: '01012345678' }, error: null });
  mocks.visits.mockResolvedValue({ data: null, count: 2, error: null });
  mocks.memories.mockResolvedValue({ data: [], error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === 'customer_has_saved_data' ? true : null, error: null }));
});

describe('customer session is a real account, not a browser registry', () => {
  it('loads the signed-in Google guest’s name, private settings and globally checked history', async () => {
    const response = await startSession(post());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.customer).toEqual({ id: customerId, displayName: 'زبونة دائمة' });
    expect(body.account).toEqual({ authUserId: userId, phone: '01012345678', email: 'customer@gmail.com',
      isAnonymous: false, googleLinked: true, hasSavedData: true });
    expect(body.verifiedVisits).toBe(2);
    expect(mocks.rpc).toHaveBeenCalledWith('check_in_customer', { p_branch_id: branchId });
    expect(mocks.rpc).toHaveBeenCalledWith('customer_has_saved_data');
    expect(mocks.inserted).not.toHaveBeenCalled();
  });
  it('provisions a first-time Google customer with the provider name but never a merchant', async () => {
    mocks.customer.mockResolvedValue({ data: null, error: null });
    mocks.settings.mockResolvedValue({ data: null, error: null });
    const response = await startSession(post());
    expect(response.status).toBe(200);
    expect(mocks.inserted).toHaveBeenCalledWith({ auth_user_id: userId, display_name: 'زبونة دائمة' });
    expect((await response.json()).account.email).toBe('customer@gmail.com');
  });
  it('never silently treats failed history verification as an empty guest account', async () => {
    mocks.rpc.mockImplementation(async (name: string) => name === 'customer_has_saved_data'
      ? { data: null, error: { code: '42501' } } : { data: null, error: null });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await startSession(post());
      expect(response.status).toBe(503);
      expect(mocks.inserted).not.toHaveBeenCalled();
    } finally { logged.mockRestore(); }
  });
  it('rejects unsigned callers before service-role profile reads', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await startSession(post());
    expect(response.status).toBe(401);
    expect(mocks.customer).not.toHaveBeenCalled();
  });
});
