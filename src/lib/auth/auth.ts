import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';

/**
 * Better Auth Server Configuration
 *
 * Implements modern, secure, and type-safe authentication following the official
 * better-auth-best-practices, better-auth-security-best-practices, organization-best-practices,
 * and two-factor-authentication-best-practices skills.
 */
export const auth = betterAuth({
  appName: 'ستامبي | Stampy SaaS',

  // Secret configuration with environment priority & resilient fallback for test/dev
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'development-secret-entropy-key-32-chars-long-cafe-memories',

  // Base URL resolution
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://memories-c9w.pages.dev'
      : 'http://localhost:3000'),

  // Trusted origins for CSRF protection and redirect safety
  trustedOrigins: [
    'https://memories-c9w.pages.dev',
    'https://*.pages.dev',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8788',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8788',
  ],

  // Core email & password authentication
  emailAndPassword: {
    enabled: true,
  },

  // Multi-tenant organization and 2FA plugins
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'owner',
      organizationLimit: 10,
      membershipLimit: 100,
    }),
    twoFactor({
      issuer: 'Stampy',
      totpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],

  // Rate limiting to mitigate brute-force and credential stuffing
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      '/api/auth/sign-in/email': {
        window: 60,
        max: 5,
      },
      '/api/auth/sign-up/email': {
        window: 60,
        max: 3,
      },
    },
  },

  // Session management with encrypted / compact cookie caching for high-speed edge lookups
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 300,
      strategy: 'compact',
    },
  },

  // Advanced security hardening
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'stampy',
    defaultCookieAttributes: {
      sameSite: 'lax',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
