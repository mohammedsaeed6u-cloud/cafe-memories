import { describe, expect, it } from 'vitest';
import {
  MAX_CUSTOMER_CARDS,
  createCustomerSessionValue,
  verifyCustomerSessionValue,
} from '@/lib/customer-session';
import { signToken } from '@/lib/signed-token';

const SECRET = 'test-customer-session-secret-32-chars-minimum';
process.env.CUSTOMER_SESSION_SECRET = SECRET;

const id = (suffix: number) =>
  `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;

describe('customer session', () => {
  it('keeps every card and puts the most recent one first', async () => {
    const value = await createCustomerSessionValue(id(2), [id(1), id(3)]);
    const claims = await verifyCustomerSessionValue(value);
    expect(claims?.customerId).toBe(id(2));
    expect(claims?.customerIds).toEqual([id(2), id(1), id(3)]);
  });

  it('de-duplicates and ignores malformed ids', async () => {
    const value = await createCustomerSessionValue(id(1), [
      id(1),
      'not-a-uuid',
      id(2),
      '',
    ]);
    const claims = await verifyCustomerSessionValue(value);
    expect(claims?.customerIds).toEqual([id(1), id(2)]);
  });

  it('caps the cookie at the maximum number of cards', async () => {
    const extra = Array.from({ length: MAX_CUSTOMER_CARDS + 5 }, (_, index) => id(index + 10));
    const value = await createCustomerSessionValue(id(1), extra);
    const claims = await verifyCustomerSessionValue(value);
    expect(claims?.customerIds).toHaveLength(MAX_CUSTOMER_CARDS);
    expect(claims?.customerIds[0]).toBe(id(1));
  });

  it('upgrades a legacy cookie that only carries customerId', async () => {
    const legacy = await signToken(
      {
        customerId: id(7),
        iat: Date.now(),
        exp: Date.now() + 60_000,
        aud: 'customer',
      },
      SECRET
    );
    const claims = await verifyCustomerSessionValue(legacy);
    expect(claims?.customerIds).toEqual([id(7)]);
  });

  it('rejects tampered or expired tokens', async () => {
    const value = await createCustomerSessionValue(id(1));
    expect(await verifyCustomerSessionValue(`${value}0`)).toBeNull();
    expect(await verifyCustomerSessionValue('')).toBeNull();

    const expired = await signToken(
      {
        customerId: id(1),
        customerIds: [id(1)],
        iat: Date.now() - 120_000,
        exp: Date.now() - 60_000,
        aud: 'customer',
      },
      SECRET
    );
    expect(await verifyCustomerSessionValue(expired)).toBeNull();
  });

  it('rejects a token minted for a different audience', async () => {
    const staff = await signToken(
      {
        customerId: id(1),
        customerIds: [id(1)],
        iat: Date.now(),
        exp: Date.now() + 60_000,
        aud: 'staff',
      },
      SECRET
    );
    expect(await verifyCustomerSessionValue(staff)).toBeNull();
  });
});
