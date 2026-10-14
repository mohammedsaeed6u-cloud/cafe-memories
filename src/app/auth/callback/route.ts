import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearOAuthIntent, merchantIntent, readOAuthIntent } from '@/lib/server/oauth-intent';

export async function GET(request: NextRequest) {
  const redirect = (path: string) => clearOAuthIntent(NextResponse.redirect(new URL(path, request.url)), merchantIntent);
  const code = request.nextUrl.searchParams.get('code');
  const flow = request.nextUrl.searchParams.get('flow');
  const googleIntent = flow === 'google'
    ? readOAuthIntent(request, merchantIntent, request.nextUrl.searchParams.get('nonce')) : null;
  if (!code) return redirect('/login?error=missing-code');
  // Never exchange a customer OAuth code just because the Supabase redirect
  // allowlist fell back to this route. Email confirmations declare their flow.
  if (flow !== 'email' && (flow !== 'google' || googleIntent === null)) {
    return redirect('/login?error=wrong-flow');
  }
  try {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const { data: { user } } = await db.auth.getUser();
    if (!user || user.is_anonymous) throw new Error('Verified merchant session missing');
    const metadataName = user.user_metadata?.cafe_name;
    const metadataSlug = user.user_metadata?.cafe_slug;
    const fromMerchantSignup = typeof metadataName === 'string' && metadataName.trim().length >= 2
      && typeof metadataSlug === 'string' && /^[a-z0-9][a-z0-9-]{2,39}$/.test(metadataSlug);
    // Email confirmations can arrive on another device (no intent cookie),
    // but still require a merchant signup with valid business metadata.
    if (flow === 'email' && !fromMerchantSignup) return redirect('/login?error=wrong-flow');
    const emailPrefix = user.email?.split('@')[0];
    const name = fromMerchantSignup ? metadataName.trim().slice(0, 100)
      : typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length >= 2
        ? user.user_metadata.full_name.trim().slice(0, 100)
        : emailPrefix && emailPrefix.length >= 2 ? emailPrefix : 'منشأة جديدة';
    const slug = fromMerchantSignup ? metadataSlug : `cafe-${user.id.slice(0, 8)}`;
    const { error: onboardingError } = await db.rpc('provision_merchant', { p_name: name, p_slug: slug });
    if (onboardingError) throw onboardingError;
    return redirect('/dashboard');
  } catch (error) {
    console.error('Merchant auth callback failed:', error);
    return redirect('/login?error=setup-failed');
  }
}
