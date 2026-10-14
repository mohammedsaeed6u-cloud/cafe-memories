import { createAuthClient } from 'better-auth/react';
import { organizationClient, twoFactorClient } from 'better-auth/client/plugins';

/**
 * Better Auth Client Configuration
 *
 * Provides React hooks (useSession) and type-safe authentication client methods
 * configured with organizationClient and twoFactorClient plugins.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.BETTER_AUTH_URL || 'https://memories-c9w.pages.dev',
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?tab=2fa';
        }
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
