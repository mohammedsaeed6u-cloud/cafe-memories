import { describe, it, expect } from 'vitest';
import { auth } from '@/lib/auth/auth';
import { authClient, signIn, signUp, signOut, useSession } from '@/lib/auth/auth-client';
import { GET, POST } from '@/app/api/auth/[...all]/route';
import { onRequest } from '../../functions/api/auth/[[catchall]]';

describe('Better Auth Suite Integration', () => {
  describe('Server Configuration (auth.ts)', () => {
    it('initializes auth instance with valid configuration', () => {
      expect(auth).toBeDefined();
      expect(typeof auth.handler).toBe('function');
      expect(auth.options).toBeDefined();
    });

    it('configures trusted origins and base URL correctly', () => {
      expect(auth.options.baseURL).toBeDefined();
      expect(Array.isArray(auth.options.trustedOrigins)).toBe(true);
      expect(auth.options.trustedOrigins).toContain('https://memories-c9w.pages.dev');
    });

    it('enables email and password authentication', () => {
      expect(auth.options.emailAndPassword).toBeDefined();
      expect(auth.options.emailAndPassword?.enabled).toBe(true);
    });

    it('registers organization and two-factor plugins', () => {
      expect(auth.options.plugins).toBeDefined();
      expect(auth.options.plugins?.length).toBeGreaterThanOrEqual(2);
      
      const pluginIds = auth.options.plugins?.map((p: any) => p.id) || [];
      expect(pluginIds).toContain('organization');
      expect(pluginIds).toContain('two-factor');
    });

    it('configures rate limiting and session security', () => {
      expect(auth.options.rateLimit).toBeDefined();
      expect(auth.options.rateLimit?.enabled).toBe(true);
      expect(auth.options.session).toBeDefined();
      expect(auth.options.session?.cookieCache?.enabled).toBe(true);
    });
  });

  describe('Client Configuration (auth-client.ts)', () => {
    it('initializes authClient with reactive hooks and methods', () => {
      expect(authClient).toBeDefined();
      expect(typeof signIn.email).toBe('function');
      expect(typeof signUp.email).toBe('function');
      expect(typeof signOut).toBe('function');
      expect(typeof useSession).toBe('function');
    });

    it('includes organizationClient and twoFactorClient plugins on client', () => {
      expect(authClient.organization).toBeDefined();
      expect(typeof authClient.organization.create).toBe('function');
      expect(typeof authClient.organization.setActive).toBe('function');
      expect(authClient.twoFactor).toBeDefined();
      expect(typeof authClient.twoFactor.enable).toBe('function');
      expect(typeof authClient.twoFactor.verifyTotp).toBe('function');
    });
  });

  describe('Next.js App Router Route Handler (route.ts)', () => {
    it('exports valid GET and POST handlers from toNextJsHandler', () => {
      expect(typeof GET).toBe('function');
      expect(typeof POST).toBe('function');
    });

    it('handles incoming GET request to /api/auth/ok', async () => {
      const req = new Request('http://localhost:3000/api/auth/ok');
      const res = await GET(req);
      expect(res).toBeDefined();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('ok', true);
    });
  });

  describe('Cloudflare Pages Function (functions/api/auth/[[catchall]].ts)', () => {
    it('handles CORS OPTIONS preflight requests', async () => {
      const req = new Request('https://memories-c9w.pages.dev/api/auth/session', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://memories-c9w.pages.dev',
        },
      });

      const res = await onRequest({ request: req, env: {} });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://memories-c9w.pages.dev');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('delegates GET request to auth handler with proper CORS headers', async () => {
      const req = new Request('https://memories-c9w.pages.dev/api/auth/ok', {
        method: 'GET',
        headers: {
          Origin: 'https://memories-c9w.pages.dev',
        },
      });

      const res = await onRequest({ request: req, env: {} });
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://memories-c9w.pages.dev');
      const data = await res.json();
      expect(data).toHaveProperty('ok', true);
    });
  });
});
