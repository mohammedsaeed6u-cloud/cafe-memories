import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=missing-code', request.url));
  try {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('User session missing');
    const metadataName = user.user_metadata?.cafe_name ?? user.user_metadata?.full_name;
    const metadataSlug = user.user_metadata?.cafe_slug;
    const emailPrefix = user.email?.split('@')[0];
    const name = typeof metadataName === 'string' && metadataName.trim().length >= 2
      ? metadataName.trim().slice(0, 100)
      : emailPrefix && emailPrefix.length >= 2 ? emailPrefix : 'منشأة جديدة';
    const slug = typeof metadataSlug === 'string' && /^[a-z0-9][a-z0-9-]{2,39}$/.test(metadataSlug)
      ? metadataSlug : `cafe-${user.id.slice(0, 8)}`;
    const { error: onboardingError } = await db.rpc('provision_merchant', { p_name: name, p_slug: slug });
    if (onboardingError) throw onboardingError;
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Merchant auth callback failed:', error);
    return NextResponse.redirect(new URL('/login?error=setup-failed', request.url));
  }
}
