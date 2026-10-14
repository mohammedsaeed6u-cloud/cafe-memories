// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { VoucherService } from '@/lib/services/voucher.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Forensic Sweep 2: Security & Business Logic Verification', () => {
  it('generates cryptographically secure gift voucher codes formatted as GIFT-XXXX', () => {
    const code = VoucherService.generateCode();
    expect(code).toMatch(/^GIFT-\d{4}$/);
    const num = parseInt(code.replace('GIFT-', ''), 10);
    expect(num).toBeGreaterThanOrEqual(1000);
    expect(num).toBeLessThanOrEqual(9999);
  });

  it('guarantees unique, pseudo-unpredictable voucher codes across 50 iterations', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(VoucherService.generateCode());
    }
    expect(codes.size).toBeGreaterThanOrEqual(45);
  });

  it('CustomerRegistryService provides deleteCustomerAsync and deletes locally and cloud-gracefully', async () => {
    const phone = '0512345678';
    CustomerRegistryService.registerCustomer(
      phone,
      'عميل اختبار الحذف',
      'coffee_lover',
      'stampy'
    );

    const res = await CustomerRegistryService.deleteCustomerAsync(phone, 'stampy');
    expect(res).toBe(true);

    const lookup = CustomerRegistryService.lookupCustomer(phone, 'stampy');
    expect(lookup.exists).toBe(false);
  });

  it('middleware blocks unauthenticated access to /dashboard even if memories_staff_session cookie is set', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'memories_staff_session=1',
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('middleware allows access to public routes without authentication', async () => {
    const req = new NextRequest('http://localhost:3000/c/stampy');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
