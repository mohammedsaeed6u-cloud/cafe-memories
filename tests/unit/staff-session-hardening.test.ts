/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { createStaffSessionValue, verifyStaffSessionValue } from '@/lib/staff-session';

describe('Staff Session Hardening & Security Guardrails', () => {
  it('fails closed in production environment when signing secret is missing', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalSecret = process.env.BETTER_AUTH_SECRET;
    const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.BETTER_AUTH_SECRET;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(
        createStaffSessionValue({
          staffId: 'staff-1',
          cafeSlug: 'stampy',
          role: 'barista',
        })
      ).rejects.toThrow(/must be set.*in production|signing secret is missing/i);
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
      if (originalSecret) process.env.BETTER_AUTH_SECRET = originalSecret;
      if (originalServiceRole) process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
    }
  });

  it('rejects tampered or forged staff session values', async () => {
    process.env.BETTER_AUTH_SECRET = 'super-secret-key-for-test-entropy-32-chars';

    const validSession = await createStaffSessionValue({
      staffId: 'staff-99',
      cafeSlug: 'stampy',
      role: 'cashier',
    });

    // Tamper with payload
    const parts = validSession.split('.');
    const tampered = `tampered${parts[0].slice(8)}.${parts[1]}`;

    const verified = await verifyStaffSessionValue(tampered);
    expect(verified).toBeNull();
  });
});
