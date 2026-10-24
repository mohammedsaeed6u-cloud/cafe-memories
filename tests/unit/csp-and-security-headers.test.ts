import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import nextConfig from '@/../next.config';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';

describe('Content Security Policy & HTTP Security Headers', () => {
  const headersFilePath = path.join(process.cwd(), 'public', '_headers');

  it('provides public/_headers file with complete CSP and defense-in-depth headers for Cloudflare Pages', () => {
    expect(fs.existsSync(headersFilePath)).toBe(true);
    const content = fs.readFileSync(headersFilePath, 'utf8');

    expect(content).toContain('Content-Security-Policy:');
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("script-src 'self'");
    expect(content).toContain('https://challenges.cloudflare.com');
    expect(content).toContain('https://*.supabase.co');
    expect(content).toContain('https://api.walletwallet.dev');
    expect(content).toContain('https://images.unsplash.com');
    expect(content).toContain('X-Frame-Options: SAMEORIGIN');
    expect(content).toContain('X-Content-Type-Options: nosniff');
    expect(content).toContain('Strict-Transport-Security:');
  });

  it('configures async headers() in next.config.ts with identical CSP policies', async () => {
    expect(nextConfig.headers).toBeDefined();
    if (nextConfig.headers) {
      const headersList = await nextConfig.headers();
      expect(Array.isArray(headersList)).toBe(true);
      expect(headersList.length).toBeGreaterThan(0);

      const rootRoute = headersList.find((h) => h.source === '/:path*');
      expect(rootRoute).toBeDefined();

      const headerKeys = rootRoute?.headers.map((h) => h.key) || [];
      expect(headerKeys).toContain('Content-Security-Policy');
      expect(headerKeys).toContain('X-Frame-Options');
      expect(headerKeys).toContain('X-Content-Type-Options');
      expect(headerKeys).toContain('Permissions-Policy');
    }
  });

  it('handles CORS OPTIONS preflight requests for API routes in middleware', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/health', {
      method: 'OPTIONS',
    });
    const res = await middleware(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('attaches Content-Security-Policy header to public routes in middleware', async () => {
    const req = new NextRequest('http://localhost:3000/c/stampy');
    const res = await middleware(req);
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('DigitalWalletService: Background image & cross-device resilience', () => {
  it('includes cardBackgroundUrl in broadcastBulkCardUpdate interface without crashing', async () => {
    vi.spyOn(DigitalWalletService, 'updateCustomerCardComprehensive').mockResolvedValue({
      success: true,
      notifiedDevices: 1,
      message: 'OK',
      serialNumber: 'test-pass-id',
    });

    const result = await DigitalWalletService.broadcastBulkCardUpdate({
      cafeSlug: 'test-cafe',
      pushMessage: 'Test push',
      cardBackgroundUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
    });

    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('notifiedDevices');
    expect(result).toHaveProperty('errors');
  });
});
