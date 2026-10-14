import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, resolveVenue } from '@/lib/server/context';

const sessionSchema = z.object({ cafeSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/),
  branchSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,59}$/).optional() });

/** Supabase Auth anonymous users are real, independently verifiable sessions. */
export async function POST(request: Request) {
  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid venue', 400);
  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return apiError('Sign in or start a Supabase guest session first', 401);
    const venue = await resolveVenue(parsed.data.cafeSlug, parsed.data.branchSlug);
    if (!venue) return apiError('Venue not found', 404);
    const admin = createAdminClient();
    const { data: existingCustomer, error } = await admin.from('customers')
      .select('id, display_name').eq('auth_user_id', user.id).is('deleted_at', null).maybeSingle();
    if (error) return apiError('Could not load customer', 503);
    let customer = existingCustomer;
    if (!customer) {
      const suggestedName = user.is_anonymous ? null : user.user_metadata?.full_name;
      const displayName = typeof suggestedName === 'string' &&
        suggestedName.trim().length >= 2 && !/\p{Cc}/u.test(suggestedName)
        ? suggestedName.trim().slice(0, 80) : 'ضيف مميز';
      const created = await admin.from('customers').insert({ auth_user_id: user.id, display_name: displayName })
        .select('id, display_name').single();
      if (created.error) {
        // Another tab may have provisioned the same auth user concurrently.
        const retry = await admin.from('customers').select('id, display_name')
          .eq('auth_user_id', user.id).is('deleted_at', null).maybeSingle();
        if (retry.error || !retry.data) return apiError('Could not create customer', 503);
        customer = retry.data;
      } else customer = created.data;
    }
    // Customer presence is branch-scoped and short-lived. It never counts as a purchase.
    const { error: checkinError } = await db.rpc('check_in_customer', { p_branch_id: venue.branchId });
    if (checkinError) {
      console.error('Customer check-in failed:', checkinError);
      return apiError('Could not start venue session', 503);
    }
    const [visits, memories, settings, history] = await Promise.all([
      admin.from('visits').select('*', { head: true, count: 'exact' })
        .eq('customer_id', customer.id).eq('organization_id', venue.organizationId)
        .eq('verification_status', 'verified'),
      admin.from('memories').select('id, caption, status, visibility, created_at, branch_id')
        .eq('customer_id', customer.id).eq('organization_id', venue.organizationId)
        .is('deleted_at', null).neq('status', 'deleted')
        .order('created_at', { ascending: false }).limit(30),
      admin.from('customer_accounts').select('phone').eq('customer_id', customer.id).maybeSingle(),
      db.rpc('customer_has_saved_data'),
    ]);
    if (visits.error || memories.error || settings.error || history.error || typeof history.data !== 'boolean') {
      console.error('Customer account lookup failed:', visits.error ?? memories.error ?? settings.error ?? history.error);
      return apiError('Could not load customer account', 503);
    }
    return NextResponse.json({ customer: { id: customer.id, displayName: customer.display_name },
      account: { authUserId: user.id, phone: settings.data?.phone ?? null,
        email: user.is_anonymous ? null : user.email ?? null,
        isAnonymous: user.is_anonymous === true, googleLinked: user.identities?.some((identity) => identity.provider === 'google') ?? false,
        hasSavedData: history.data },
      venue, verifiedVisits: visits.count ?? 0,
      memories: (memories.data ?? []).map((memory) => ({
        id: memory.id, caption: memory.caption, status: memory.status, visibility: memory.visibility,
        createdAt: memory.created_at, branchId: memory.branch_id,
        imageUrl: `/api/v1/media/${memory.id}?variant=optimized`,
      })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Customer session failed:', error);
    return apiError('Customer session unavailable', 503);
  }
}
