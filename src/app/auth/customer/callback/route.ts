import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearOAuthIntent, customerLinkIntent, readOAuthIntent } from '@/lib/server/oauth-intent';

/** Customer OAuth must never pass through the merchant-provisioning callback. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cafe = params.get('cafe');
  const branch = params.get('branch');
  const validCafe = cafe && /^[a-z0-9][a-z0-9-]{2,39}$/.test(cafe);
  const validBranch = !branch || /^[a-z0-9][a-z0-9-]{0,59}$/.test(branch);
  const destination = new URL(validCafe && validBranch ? `/c/${cafe}` : '/', request.url);
  if (validCafe && validBranch && branch) destination.searchParams.set('branch', branch);
  const redirect = (error?: string) => {
    if (error && validCafe && validBranch) destination.searchParams.set('auth_error', error);
    return clearOAuthIntent(NextResponse.redirect(destination), customerLinkIntent);
  };
  if (!validCafe || !validBranch) return redirect();

  const flow = params.get('flow');
  // If a provider stripped the query parameters from a manual-link redirect,
  // never silently treat that code as a normal sign-in and replace the guest.
  if (!flow && request.cookies.has(customerLinkIntent.name)) return redirect('link-failed');
  const linkedUserId = flow === 'link'
    ? readOAuthIntent(request, customerLinkIntent, params.get('nonce')) : null;
  if (flow && (flow !== 'link' || !linkedUserId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkedUserId))) return redirect('link-failed');
  if (params.has('error')) return redirect(flow === 'link' ? 'link-failed' : 'sign-in-failed');
  const code = params.get('code');
  if (!code) return redirect('missing-code');
  try {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) throw new Error('Customer session missing after OAuth');
    // Manual linking preserves the Auth user ID (and thus all visits and photos).
    // Never treat a different account as a successful transfer.
    if (flow === 'link' && user.id !== linkedUserId) return redirect('identity-mismatch');
    if (user.is_anonymous) return redirect('sign-in-failed');
    return redirect(); // /api/v1/customer/session provisions ONLY a customer on arrival.
  } catch (error) {
    console.error('Customer auth callback failed:', error);
    return redirect(flow === 'link' ? 'link-failed' : 'sign-in-failed');
  }
}
