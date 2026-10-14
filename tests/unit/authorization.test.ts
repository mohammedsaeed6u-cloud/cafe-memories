import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireMerchant, requireCustomer } from '@/lib/server/context';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), member: vi.fn(), branch: vi.fn(), organization: vi.fn(), customer: vi.fn() }));

const query = (result: () => Promise<unknown>) => {
  const builder = { select: () => builder, eq: () => builder, is: () => builder,
    order: () => builder, limit: () => builder, maybeSingle: result };
  return builder;
};
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser },
  from: (name: string) => name === 'organization_members' ? query(mocks.member) :
    name === 'organizations' ? query(mocks.organization) : query(mocks.customer),
}) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => query(mocks.branch) }) }));

const userId = '344ccf2e-0de7-4d1a-9180-0022c5b3c7d0';
const orgId = 'a1923b57-3665-4cdc-b4ac-0075771c86df';
const branchId = '746dbba1-7f7c-4493-823e-115c3198c325';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  mocks.member.mockResolvedValue({ data: { organization_id: orgId, role: 'staff', branch_id: branchId }, error: null });
  mocks.branch.mockResolvedValue({ data: { organization_id: orgId }, error: null });
  mocks.organization.mockResolvedValue({ data: { status: 'active' }, error: null });
  mocks.customer.mockResolvedValue({ data: { id: userId }, error: null });
});

describe('verified session + branch-scoped membership boundary', () => {
  it('rejects unauthenticated callers before service role reads', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await requireMerchant({ branchId });
    expect(result.error?.status).toBe(401);
    expect(mocks.branch).not.toHaveBeenCalled();
  });
  it('rejects an unrelated branch even for a signed-in merchant', async () => {
    mocks.branch.mockResolvedValue({ data: { organization_id: '6e1f7cce-e00c-4145-b3c3-be16ed7116c4' }, error: null });
    const result = await requireMerchant({ organizationId: orgId, branchId });
    expect(result.error?.status).toBe(403);
    expect(mocks.member).not.toHaveBeenCalled();
  });
  it('rejects staff assigned to a different branch within the organization', async () => {
    mocks.member.mockResolvedValue({ data: { organization_id: orgId,
      role: 'staff', branch_id: 'c9e02c56-4e39-4ceb-ab9f-ae38a8657077' }, error: null });
    const result = await requireMerchant({ branchId });
    expect(result.error?.status).toBe(403);
  });
  it('blocks suspended organizations even when the user is still a member', async () => {
    mocks.organization.mockResolvedValue({ data: { status: 'suspended' }, error: null });
    const result = await requireMerchant({ branchId });
    expect(result.error?.status).toBe(403);
  });
  it('allows only owner/admin/manager moderation and authenticated customers', async () => {
    expect((await requireMerchant({ branchId, roles: ['owner', 'admin', 'manager'] })).error?.status).toBe(403);
    const staff = await requireMerchant({ branchId });
    expect(staff.context?.membership.branchId).toBe(branchId);
    const guest = await requireCustomer();
    expect(guest.context?.customerId).toBe(userId);
  });
});
