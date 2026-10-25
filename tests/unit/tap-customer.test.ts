import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ensureTapCustomer } from '@/lib/server/tap-service';

const ORG_ONE = '11111111-1111-4111-8111-111111111111';
const ORG_TWO = '22222222-2222-4222-8222-222222222222';
const CARD_ONE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CARD_TWO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NEW_CARD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const mockReadSession = vi.fn();
vi.mock('@/lib/customer-session', () => ({
  readCustomerSession: (...args: unknown[]) => mockReadSession(...args),
}));

let cards: Array<{ id: string; organization_id: string | null }> = [];
const insertedCustomers: unknown[] = [];
const updatedCustomers: unknown[] = [];
let idFilter: string[] = [];

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.in = vi.fn((_column: string, ids: string[]) => {
        idFilter = ids;
        return builder;
      });
      builder.is = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.update = vi.fn((payload: unknown) => {
        if (table === 'customers') updatedCustomers.push(payload);
        return builder;
      });
      builder.insert = vi.fn((payload: unknown) => {
        if (table === 'customers') insertedCustomers.push(payload);
        return builder;
      });
      builder.single = vi.fn(async () => ({ data: { id: NEW_CARD }, error: null }));
      builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve({
          data:
            table === 'customers'
              ? cards.filter((card) => idFilter.includes(card.id))
              : null,
          error: null,
        }).then(resolve, reject);
      return builder;
    },
  }),
}));

function request() {
  return new NextRequest('http://localhost:3000/api/v1/taps', { method: 'POST' });
}

function session(customerId: string, customerIds: string[]) {
  mockReadSession.mockResolvedValue({
    customerId,
    customerIds,
    iat: Date.now(),
    exp: Date.now() + 60_000,
    aud: 'customer',
  });
}

describe('ensureTapCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cards = [
      { id: CARD_ONE, organization_id: ORG_ONE },
      { id: CARD_TWO, organization_id: ORG_TWO },
    ];
    insertedCustomers.length = 0;
    updatedCustomers.length = 0;
    idFilter = [];
  });

  it('reuses the card that belongs to the tapped venue', async () => {
    session(CARD_TWO, [CARD_TWO, CARD_ONE]);
    const result = await ensureTapCustomer(request(), ORG_ONE);
    expect(result).toEqual({
      customerId: CARD_ONE,
      minted: false,
      activeCardChanged: true,
    });
    expect(insertedCustomers).toHaveLength(0);
    expect(updatedCustomers).toEqual([{ last_seen_at: expect.any(String) }]);
  });

  it('does not flag a change when the venue card is already the active one', async () => {
    session(CARD_ONE, [CARD_ONE, CARD_TWO]);
    const result = await ensureTapCustomer(request(), ORG_ONE);
    expect(result.activeCardChanged).toBe(false);
    expect(result.minted).toBe(false);
  });

  it('mints a new tenant-scoped card for a venue with no card yet', async () => {
    session(CARD_ONE, [CARD_ONE]);
    const result = await ensureTapCustomer(request(), ORG_TWO);
    expect(result).toEqual({
      customerId: NEW_CARD,
      minted: true,
      activeCardChanged: false,
    });
    expect(insertedCustomers[0]).toMatchObject({ organization_id: ORG_TWO });
  });

  it('mints a card when there is no session at all', async () => {
    mockReadSession.mockResolvedValue(null);
    const result = await ensureTapCustomer(request(), ORG_ONE);
    expect(result.minted).toBe(true);
    expect(result.customerId).toBe(NEW_CARD);
  });
});
