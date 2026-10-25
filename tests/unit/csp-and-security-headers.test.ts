import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import nextConfig from '@/../next.config';

describe('Content Security Policy & HTTP Security Headers', () => {
  const headersFilePath = path.join(process.cwd(), 'public', '_headers');

  it('ships public/_headers with CSP and defense-in-depth headers for static assets', () => {
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
      expect(headerKeys).toContain('Strict-Transport-Security');
      expect(headerKeys).toContain('Referrer-Policy');
    }
  });

  it('forwards OAuth codes landing on / or /login to the PKCE handler', async () => {
    expect(nextConfig.redirects).toBeDefined();
    const redirects = (await nextConfig.redirects?.()) ?? [];

    for (const source of ['/', '/login']) {
      const rule = redirects.find((entry) => entry.source === source);
      expect(rule, `missing redirect for ${source}`).toBeDefined();
      expect(rule?.destination).toBe('/auth/callback');
      expect(rule?.has).toEqual([{ type: 'query', key: 'code' }]);
      expect(rule?.permanent).toBe(false);
    }
  });

  it('does not ship a Node middleware bundle', () => {
    // Next 16 proxies always run on the Node runtime, which makes OpenNext
    // bundle a second copy of Next (~0.65 MB gzip + 0.54 MB wasm). The free
    // plan cannot fit that, so authorization lives in server components.
    expect(fs.existsSync(path.join(process.cwd(), 'src', 'proxy.ts'))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), 'src', 'middleware.ts'))).toBe(false);
  });
});
