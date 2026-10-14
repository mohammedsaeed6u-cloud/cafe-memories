import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';
import { processWalletCampaignBatch, walletCampaignConfig } from '@/lib/server/wallet-campaigns';

export const runtime = 'nodejs';
async function scope(params: Promise<{ campaignId: string }>) {
  const { campaignId } = await params;
  if (!z.uuid().safeParse(campaignId).success) return { error: apiError('Invalid campaign',400), campaignId:null, orgId:null };
  const auth = await requireMerchant({roles:['owner','admin','manager']});
  if (auth.error) return {error:auth.error,campaignId:null,orgId:null};
  if (auth.context.membership.branchId) return {error:apiError('Organization-wide manager required',403),campaignId:null,orgId:null};
  return { error:null, campaignId, orgId:auth.context.membership.organizationId };
}

/** Activates a draft and pushes at most five distinct, explicitly opted-in passes. */
export async function POST(_request: Request, {params}:{params:Promise<{campaignId:string}>}) {
  const auth = await scope(params);
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const [campaign, org] = await Promise.all([
    admin.from('campaigns').select('id,status,config').eq('id',auth.campaignId!)
      .eq('organization_id',auth.orgId!).maybeSingle(),
    admin.from('organizations').select('wallet_connector_id').eq('id',auth.orgId!).single(),
  ]);
  if (campaign.error || !campaign.data || org.error || !org.data) return apiError('Campaign unavailable', 404);
  const config = walletCampaignConfig(campaign.data.config);
  if (!config || !['draft','active'].includes(campaign.data.status)) return apiError('Campaign is closed',409);
  if (!org.data.wallet_connector_id) return apiError('Connect WalletWallet first', 409);
  const connection = await admin.from('wallet_connectors').select('plan,enabled,verified_at')
    .eq('id',org.data.wallet_connector_id).maybeSingle();
  if (connection.error || !connection.data?.enabled || connection.data.plan === 'free' ||
      !connection.data.verified_at || Date.now()-new Date(connection.data.verified_at).getTime() >= 24*60*60_000) {
    return apiError('Campaigns need an active, freshly tested WalletWallet Pro or Business connection', 409);
  }
  if (campaign.data.status === 'draft') {
    const activated = await admin.from('campaigns').update({status:'active', updated_at:new Date().toISOString()})
      .eq('id',auth.campaignId!).eq('organization_id',auth.orgId!).eq('status','draft').select('id').maybeSingle();
    if (activated.error) return apiError('Could not activate campaign',503);
    // A parallel authorized request may have activated it first. The DB claim
    // still guarantees no duplicate per-pass send.
  }
  try {
    const batch = await processWalletCampaignBatch(auth.campaignId!, config);
    return NextResponse.json({status:'active', ...batch,
      note:'Accepted means the provider acknowledged an update, not that the phone displayed it. Unknown outcomes will not be resent automatically.'},
    {headers:{'Cache-Control':'no-store'}});
  } catch {
    return apiError('Campaign activation saved; provider delivery needs administrator review or a later batch',503);
  }
}

/** Stop future reservations. A provider request already in flight cannot be recalled. */
export async function PATCH(request: Request, {params}:{params:Promise<{campaignId:string}>}) {
  const body = z.object({action:z.literal('end')}).strict().safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError('Invalid campaign action',400);
  const auth = await scope(params);
  if (auth.error) return auth.error;
  const { data, error } = await createAdminClient().from('campaigns')
    .update({status:'ended',updated_at:new Date().toISOString()})
    .eq('id',auth.campaignId!).eq('organization_id',auth.orgId!)
    .in('status',['draft','active']).select('id').maybeSingle();
  if (error || !data) return apiError('Campaign already closed or unavailable',409);
  return NextResponse.json({status:'ended'},{headers:{'Cache-Control':'no-store'}});
}
