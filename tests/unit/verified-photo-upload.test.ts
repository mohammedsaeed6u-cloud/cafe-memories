import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/v1/memories/upload/route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), venue: vi.fn(), visit: vi.fn(), quota: vi.fn(),
  rpc: vi.fn(), process: vi.fn(), upload: vi.fn(), remove: vi.fn(), filters: vi.fn(),
}));
const chain = (terminal: () => Promise<unknown>, singular = false) => {
  const builder = {
    select: () => builder, eq: (field: string, value: unknown) => {
      mocks.filters(field, value); return builder;
    }, gte: () => builder,
    maybeSingle: singular ? terminal : undefined,
    then: (success: (result: unknown) => unknown, failure: (error: unknown) => unknown) =>
      terminal().then(success, failure),
  };
  return builder;
};
vi.mock('@/lib/server/context', () => ({
  requireCustomer: mocks.auth,
  resolveVenue: mocks.venue,
  apiError: (message: string, status: number) => NextResponse.json({ error: message }, { status }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({
  from: (table: string) => table === 'visits' ? chain(mocks.visit, true) : chain(mocks.quota),
  rpc: mocks.rpc,
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
}) }));
vi.mock('@/lib/services/images', () => ({ processImageDerivatives: mocks.process }));

const customerId = 'b14106f1-3a47-4ba3-bb20-bbbd1d3660ce';
const orgId = '8912d36a-c426-4a92-a392-d627a259c202';
const branchId = '51a42698-d6a4-46cb-979d-95fb18c0c9df';
const visitId = 'dcf310eb-7e95-4ce2-b21b-f76d9ba6405d';
const memoryId = '22899983-447d-40f0-88c6-12589a80b480';
function post(id: string | null = visitId) {
  const form = new FormData();
  form.set('file', new File([new Uint8Array([0xff, 0xd8, 0xff])], 'from-phone.jpg', { type: 'image/jpeg' }));
  form.set('cafeSlug', 'alpha-cafe');
  form.set('branchSlug', 'main');
  form.set('caption', 'Remember this');
  if (id !== null) form.set('visitId', id);
  return new NextRequest('https://example.test/api/v1/memories/upload', { method: 'POST', body: form });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ context: { customerId } });
  mocks.venue.mockResolvedValue({ organizationId: orgId, branchId });
  mocks.visit.mockResolvedValue({ data: { id: visitId }, error: null });
  mocks.quota.mockResolvedValue({ count: 0, error: null });
  mocks.process.mockResolvedValue({ originalBuffer: Buffer.from('one'),
    optimizedBuffer: Buffer.from('two'), thumbnailBuffer: Buffer.from('three') });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: memoryId, error: null });
});

describe('customer-phone photos attach only to an authorized confirmed visit', () => {
  it('never stores media for unsigned customers or missing/unverified visits', async () => {
    mocks.auth.mockResolvedValueOnce({ error: NextResponse.json({}, { status: 401 }) });
    expect((await POST(post())).status).toBe(401);
    expect(mocks.upload).not.toHaveBeenCalled();
    mocks.visit.mockResolvedValueOnce({ data: null, error: null });
    expect((await POST(post())).status).toBe(404);
    expect(mocks.process).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('saves private derivatives and calls only the verified-visit transaction', async () => {
    const response = await POST(post());
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).visitId).toBe(visitId);
    expect(mocks.upload).toHaveBeenCalledTimes(3);
    expect(mocks.filters).toHaveBeenCalledWith('customer_id', customerId);
    expect(mocks.filters).toHaveBeenCalledWith('organization_id', orgId);
    expect(mocks.filters).toHaveBeenCalledWith('verification_status', 'verified');
    expect(mocks.rpc).toHaveBeenCalledWith('attach_verified_visit_memory', expect.objectContaining({
      p_customer_id: customerId, p_visit_id: visitId,
      p_caption: 'Remember this', p_live_wall_consent: false,
      p_original_key: expect.stringMatching(new RegExp(`^${orgId}/${customerId}/`)),
    }));
    expect(mocks.rpc).not.toHaveBeenCalledWith('create_customer_memory', expect.anything());
  });
  it('cleans up image objects when a concurrent upload already used the stamp', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    const response = await POST(post());
    expect(response.status).toBe(409);
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(mocks.remove.mock.calls[0][0]).toHaveLength(3);
  });
  it('keeps legacy pending-photo ingestion but does not use it for the new stamp UI', async () => {
    expect((await POST(post(null))).status).toBe(201);
    expect(mocks.visit).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith('create_customer_memory', expect.objectContaining({
      p_customer_id: customerId, p_branch_id: branchId,
    }));
  });
});
