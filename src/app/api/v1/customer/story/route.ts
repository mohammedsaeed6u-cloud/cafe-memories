import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireCustomer } from '@/lib/server/context';
import { publicBrand } from '@/lib/brand';
import type { KeepsakeVisit } from '@/lib/keepsakes';

type Admin = ReturnType<typeof createAdminClient>;
type VisitRow = { id: string; branch_id: string; verified_at: string | null };

/** Resolve private images only by the JWT owner's visits in this organization. */
async function withPhotos(admin: Admin, customerId: string, organizationId: string,
  visits: VisitRow[]): Promise<KeepsakeVisit[]> {
  if (!visits.length) return [];
  const ids = visits.map((visit) => visit.id);
  const [photos, branches] = await Promise.all([
    admin.from('memories').select('id, visit_id, caption, created_at')
      .eq('customer_id', customerId).eq('organization_id', organizationId)
      .in('visit_id', ids).is('deleted_at', null).neq('status', 'deleted')
      .order('created_at', { ascending: false }).limit(180),
    admin.from('branches').select('id, name').eq('organization_id', organizationId)
      .in('id', [...new Set(visits.map((visit) => visit.branch_id))]),
  ]);
  if (photos.error || branches.error) throw new Error('Could not load visit photos');
  const imageByVisit = new Map<string, { id: string; caption: string | null; imageUrl: string }>();
  for (const photo of photos.data ?? []) {
    if (!imageByVisit.has(photo.visit_id)) imageByVisit.set(photo.visit_id, {
      id: photo.id, caption: photo.caption,
      imageUrl: `/api/v1/media/${photo.id}?variant=optimized`,
    });
  }
  const branchById = new Map((branches.data ?? []).map((branch) => [branch.id, branch.name]));
  return visits.map((visit) => ({
    id: visit.id, branchName: branchById.get(visit.branch_id) ?? 'فرع المنشأة',
    verifiedAt: visit.verified_at ?? '', photo: imageByVisit.get(visit.id) ?? null,
  }));
}

/** Private, permanent card ledger. Card IDs are stable even when rewards change. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cafeSlug = params.get('cafeSlug');
  const cardId = params.get('cardId');
  const page = params.get('page') ?? '0';
  if (!cafeSlug || !/^[a-z0-9][a-z0-9-]{2,39}$/.test(cafeSlug) ||
      (cardId !== null && !z.uuid().safeParse(cardId).success) ||
      !/^(0|[1-9][0-9]{0,5})$/.test(page)) return apiError('Invalid story request', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  try {
    const admin = createAdminClient();
    // An already earned keepsake remains readable if the branch later closes.
    const { data: organization, error: orgError } = await admin.from('organizations')
      .select('id,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links')
      .eq('slug', cafeSlug).maybeSingle();
    if (orgError) return apiError('Could not load venue', 503);
    if (!organization) return apiError('Venue not found', 404);
    const organizationId = organization.id;
    const customerId = auth.context.customerId;
    const [recent, totalCards, requestedCard] = await Promise.all([
      admin.rpc('list_unpictured_verified_visits', {
        p_customer_id: customerId, p_organization_id: organizationId, p_limit: 60,
      }),
      admin.from('keepsake_cards').select('id', { head: true, count: 'exact' })
        .eq('customer_id', customerId).eq('organization_id', organizationId),
      cardId ? admin.from('keepsake_cards')
        .select('id, reward_name, threshold, unlocked_at, redeemed_at, visit_ids')
        .eq('id', cardId).eq('customer_id', customerId).eq('organization_id', organizationId)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (recent.error || totalCards.error || requestedCard.error) return apiError('Could not load memories', 503);
    if (cardId && !requestedCard.data) return apiError('Keepsake not found', 404);
    const offset = Number(page) * 12;
    const cardList = offset < (totalCards.count ?? 0)
      ? await admin.from('keepsake_cards')
        .select('id, reward_name, threshold, unlocked_at, redeemed_at')
        .eq('customer_id', customerId).eq('organization_id', organizationId)
        .order('sequence_number', { ascending: false })
        .range(offset, offset + 11)
      : { data: [], error: null };
    if (cardList.error) return apiError('Could not load keepsakes', 503);
    const recentVisits = await withPhotos(admin, customerId, organizationId,
      (recent.data ?? []).map((visit) => ({
        id: visit.visit_id, branch_id: visit.branch_id, verified_at: visit.verified_at,
      })));
    let card = null;
    if (requestedCard.data) {
      const saved = requestedCard.data;
      const { data: visits, error: visitError } = await admin.from('visits')
        .select('id, branch_id, verified_at')
        .eq('customer_id', customerId).eq('organization_id', organizationId)
        .eq('verification_status', 'verified').in('id', saved.visit_ids);
      if (visitError || !visits || visits.length !== saved.threshold) {
        return apiError('Keepsake visits unavailable', 503);
      }
      const visitById = new Map(visits.map((visit) => [visit.id, visit]));
      const ordered = saved.visit_ids.map((id) => visitById.get(id));
      if (ordered.some((visit) => !visit)) return apiError('Keepsake visits unavailable', 503);
      card = {
        id: saved.id, rewardName: saved.reward_name, threshold: saved.threshold,
        unlockedAt: saved.unlocked_at, redeemedAt: saved.redeemed_at,
        visits: await withPhotos(admin, customerId, organizationId, ordered as VisitRow[]),
      };
    }
    return NextResponse.json({ organizationName: organization.name, brand: publicBrand(organization),
      eligibleVisits: recentVisits.filter((visit) => !visit.photo),
      cards: (cardList.data ?? []).map((saved) => ({ id: saved.id,
        rewardName: saved.reward_name, threshold: saved.threshold,
        unlockedAt: saved.unlocked_at, redeemedAt: saved.redeemed_at })),
      cardsTotal: totalCards.count ?? 0, card,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Customer keepsake lookup failed:', error);
    return apiError('Could not load memories', 503);
  }
}
