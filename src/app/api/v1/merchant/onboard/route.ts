import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/server/context';

const schema = z.object({ name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/) });

/** Provision merchant profile, organization, branch and membership atomically. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Valid business name and slug required', 400);
  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return apiError('Sign in first', 401);
    const { data: organizationId, error } = await db.rpc('provision_merchant', {
      p_name: parsed.data.name, p_slug: parsed.data.slug,
    });
    if (error) {
      if (error.code === '23505') return apiError('Business slug is already taken', 409);
      if (error.code === '42501') return apiError('Not authorized', 403);
      console.error('Merchant onboarding failed:', error);
      return apiError('Could not create business', 503);
    }
    return NextResponse.json({ organizationId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Merchant onboarding unavailable:', error);
    return apiError('Service unavailable', 503);
  }
}
