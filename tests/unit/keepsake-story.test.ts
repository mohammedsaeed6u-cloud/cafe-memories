import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/v1/customer/story/route';

const mocks = vi.hoisted(() => ({
  customer: vi.fn(), from: vi.fn(), rpc: vi.fn(),
  rows: {} as Record<string, Record<string, unknown>[]>,
}));

function query(table: string) {
  mocks.from(table);
  let rows = [...(mocks.rows[table] ?? [])];
  let head = false;
  let count = false;
  let total = 0;
  const builder = {
    select: (_columns: string, options?: { head?: boolean; count?: string }) => {
      head = options?.head ?? false;
      count = options?.count === 'exact';
      return builder;
    },
    eq: (field: string, value: unknown) => { rows = rows.filter((row) => row[field] === value); return builder; },
    neq: (field: string, value: unknown) => { rows = rows.filter((row) => row[field] !== value); return builder; },
    is: (field: string, value: null) => { rows = rows.filter((row) => row[field] === value); return builder; },
    not: (field: string, _operator: string, value: null) => {
      rows = rows.filter((row) => row[field] !== value); return builder;
    },
    in: (field: string, values: string[]) => {
      rows = rows.filter((row) => values.includes(String(row[field]))); return builder;
    },
    order: () => builder,
    limit: (size: number) => { rows = rows.slice(0, size); return builder; },
    range: (start: number, end: number) => { total = rows.length; rows = rows.slice(start, end + 1); return builder; },
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    then: (fulfilled: (value: unknown) => unknown, rejected: (reason: unknown) => unknown) =>
      Promise.resolve({ data: head ? null : rows, count: count ? (total || rows.length) : null, error: null })
        .then(fulfilled, rejected),
  };
  return builder;
}
vi.mock('@/lib/server/context', () => ({
  requireCustomer: mocks.customer,
  apiError: (message: string, status: number) => NextResponse.json({ error: message }, { status }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: query, rpc: mocks.rpc }) }));

const owner = randomUUID();
const other = randomUUID();
const alpha = randomUUID();
const beta = randomUUID();
const branch = randomUUID();
const v1 = randomUUID();
const v2 = randomUUID();
const vOther = randomUUID();
const vBeta = randomUUID();
const photo = randomUUID();
const foreignPhoto = randomUUID();
const card = randomUUID();
const otherCard = randomUUID();
const betaCard = randomUUID();
const at = '2026-10-14T12:00:00.000Z';
const get = (qs: string) => GET(new NextRequest(`https://example.test/api/v1/customer/story?${qs}`));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.customer.mockResolvedValue({ context: { customerId: owner } });
  mocks.rpc.mockImplementation(async (_name: string, args: { p_customer_id: string; p_organization_id: string }) => ({
    data: (mocks.rows.visits ?? [])
      .filter((visit) => visit.customer_id === args.p_customer_id &&
        visit.organization_id === args.p_organization_id && visit.verification_status === 'verified' &&
        !(mocks.rows.memories ?? []).some((photo) => photo.visit_id === visit.id && photo.deleted_at === null))
      .map((visit) => ({ visit_id: visit.id, branch_id: visit.branch_id, verified_at: visit.verified_at })),
    error: null,
  }));
  mocks.rows = {
    organizations: [
      { id: alpha, name: 'Alpha', slug: 'alpha-cafe' },
      { id: beta, name: 'Beta', slug: 'beta-cafe' },
    ],
    visits: [
      { id: v1, customer_id: owner, organization_id: alpha, branch_id: branch,
        verification_status: 'verified', verified_at: at },
      { id: v2, customer_id: owner, organization_id: alpha, branch_id: branch,
        verification_status: 'verified', verified_at: at },
      { id: vOther, customer_id: other, organization_id: alpha, branch_id: branch,
        verification_status: 'verified', verified_at: at },
      { id: vBeta, customer_id: owner, organization_id: beta, branch_id: branch,
        verification_status: 'verified', verified_at: at },
    ],
    keepsake_cards: [
      { id: card, customer_id: owner, organization_id: alpha, reward_name: 'Coffee',
        threshold: 2, visit_ids: [v1, v2], unlocked_at: at, redeemed_at: null },
      { id: otherCard, customer_id: other, organization_id: alpha, reward_name: 'Secret',
        threshold: 2, visit_ids: [vOther, vOther], unlocked_at: at, redeemed_at: null },
      { id: betaCard, customer_id: owner, organization_id: beta, reward_name: 'Other cafe',
        threshold: 2, visit_ids: [vBeta, vBeta], unlocked_at: at, redeemed_at: null },
    ],
    memories: [
      { id: photo, customer_id: owner, organization_id: alpha, visit_id: v1,
        caption: 'My photo', status: 'pending', deleted_at: null, created_at: at },
      { id: foreignPhoto, customer_id: other, organization_id: alpha, visit_id: vOther,
        caption: 'Private', status: 'pending', deleted_at: null, created_at: at },
    ],
    branches: [{ id: branch, organization_id: alpha, name: 'Main' }],
  };
});

describe('private guest story route', () => {
  it('fails closed before any privileged reads for unsigned or invalid requests', async () => {
    mocks.customer.mockResolvedValueOnce({ error: NextResponse.json({}, { status: 401 }) });
    expect((await get(`cafeSlug=alpha-cafe&cardId=${card}`)).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
    expect((await get('cafeSlug=alpha-cafe&cardId=not-a-uuid')).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('binds card, visits and images to the authenticated customer AND requested venue', async () => {
    const response = await get(`cafeSlug=alpha-cafe&cardId=${card}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const story = await response.json();
    expect(story.cardsTotal).toBe(1);
    expect(mocks.rpc).toHaveBeenCalledWith('list_unpictured_verified_visits', {
      p_customer_id: owner, p_organization_id: alpha, p_limit: 60,
    });
    expect(story.cards).toHaveLength(1);
    expect(story.card.visits).toHaveLength(2);
    expect(story.card.visits[0].photo.imageUrl).toContain(photo);
    expect(story.card.visits[1].photo).toBeNull();
    expect(story.eligibleVisits).toHaveLength(1);
    expect(JSON.stringify(story)).not.toContain(foreignPhoto);
    expect(JSON.stringify(story)).not.toContain('Other cafe');
  });
  it('does not reveal someone else’s card or the same customer’s other-venue card', async () => {
    expect((await get(`cafeSlug=alpha-cafe&cardId=${otherCard}`)).status).toBe(404);
    expect((await get(`cafeSlug=alpha-cafe&cardId=${betaCard}`)).status).toBe(404);
    expect((await get('cafeSlug=alpha-cafe&page=1')).status).toBe(200);
    expect((await (await get('cafeSlug=alpha-cafe&page=1')).json()).cards).toEqual([]);
  });
});
