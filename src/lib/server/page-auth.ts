/**
 * Page-level identity for server components.
 *
 * Next 16 always runs `proxy.ts` on the Node.js runtime, and OpenNext then has
 * to ship a second copy of the whole Next runtime to the Worker. That alone was
 * ~0.65 MB gzipped plus 0.54 MB of `@vercel/og` wasm — more than the free plan
 * allows. Authorization therefore lives where it is authoritative anyway: in
 * the server component that renders the page, and again in every route handler.
 *
 * These helpers are optimistic gates for navigation only. Data access is always
 * re-checked by `src/lib/server/context.ts` inside the API route.
 */

import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { envList } from '@/lib/env';
import {
  STAFF_SESSION_COOKIE,
  verifyStaffSessionValue,
  type StaffSessionClaims,
} from '@/lib/staff-session';

export type PageIdentity =
  | { kind: 'merchant'; userId: string; email: string | null }
  | { kind: 'staff'; staff: StaffSessionClaims };

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Merchant session, staff session, or `null`. Never throws when Supabase is unset. */
export async function getPageIdentity(): Promise<PageIdentity | null> {
  const jar = await cookies();

  const staff = await verifyStaffSessionValue(jar.get(STAFF_SESSION_COOKIE)?.value);
  if (staff) return { kind: 'staff', staff };

  if (!supabaseConfigured()) return null;

  const session = await auth.api.getSession();
  if (!session) return null;
  return { kind: 'merchant', userId: session.user.id, email: session.user.email };
}

/** Redirects to `/login` when there is no merchant or staff identity. */
export async function requirePageIdentity(): Promise<PageIdentity> {
  const identity = await getPageIdentity();
  if (!identity) redirect('/login');
  return identity;
}

/**
 * Restricts a page to the `SUPER_ADMIN_EMAILS` allow-list.
 *
 * Staff sessions are not platform admins, so they are sent to the dashboard.
 */
export async function requireSuperAdminPage(): Promise<PageIdentity> {
  const identity = await requirePageIdentity();

  if (identity.kind === 'staff') redirect('/dashboard');

  const allowed = envList('SUPER_ADMIN_EMAILS');
  const email = identity.email?.toLowerCase() ?? '';
  if (!email || !allowed.includes(email)) redirect('/dashboard');

  return identity;
}
