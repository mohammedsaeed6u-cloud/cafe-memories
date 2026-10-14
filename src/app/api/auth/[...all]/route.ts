import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth/auth';

/**
 * Next.js App Router Route Handler for Better Auth
 *
 * Matches /api/auth/* and routes all auth requests (sign-in, sign-up, session,
 * 2FA, organization, rate-limiting, CSRF) through the Better Auth handler.
 */
export const { GET, POST } = toNextJsHandler(auth);
