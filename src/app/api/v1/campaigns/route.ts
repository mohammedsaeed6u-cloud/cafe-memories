import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';
import { walletCampaignConfig } from '@/lib/server/wallet-campaigns';

const campaignSchema = z.object({
  name: z.string().trim().min(3).max(60),
  message: z.string().trim().min(3).max(110),
  audience: z.enum(['all','returning','inactive30']),
}).strict();
async function ownerContext() {
  const auth = await requireMerchant({ roles: ['owner','admin','manager'] });
  if (auth.error) return { error: auth.error, orgId: null };
  if (auth.context.membership.branchId) return { error: apiError('Only an organization-wide manager can send campaigns', 403), orgId: null };
  return { error: null, orgId: auth.context.membership.organizationId };
}

export async function GET() {
  const auth = await ownerContext();
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const [campaigns, stats, organization] = await Promise.all([
    admin.from('campaigns').select('id,name,status,config,created_at,updated_at')
      .eq('organization_id',auth.orgId!).order('created_at',{ascending:false}).limit(30),
    admin.rpc('wallet_campaign_delivery_counts',{p_org:auth.orgId!}),
    admin.from('organizations').select('wallet_connector_id').eq('id',auth.orgId!).single(),
  ]);
  if (campaigns.error || stats.error || organization.error) return apiError('Campaigns unavailable', 503);
  const countById = new Map((stats.data ?? []).map((row) => [row.campaign_id,row]));
  const connector = organization.data.wallet_connector_id
    ? await admin.from('wallet_connectors').select('plan,enabled,verified_at')
      .eq('id',organization.data.wallet_connector_id).maybeSingle()
    : null;
  const ready = Boolean(connector?.data?.enabled && connector.data.plan !== 'free' &&
    connector.data.verified_at && Date.now() - new Date(connector.data.verified_at).getTime() < 24*60*60_000);
  return NextResponse.json({ walletReady: ready, campaigns: (campaigns.data ?? [])
    .filter((row) => walletCampaignConfig(row.config))
    .map((row) => ({ id: row.id, name: row.name, status: row.status,
      config: walletCampaignConfig(row.config), createdAt: row.created_at,
      counts: { accepted: countById.get(row.id)?.accepted ?? 0,
        unknown: countById.get(row.id)?.unknown ?? 0,
        processing: countById.get(row.id)?.processing ?? 0 } })) },
  { headers: { 'Cache-Control': 'no-store' } });
}

/** Creating a draft NEVER sends a notification. Content becomes immutable on activation. */
export async function POST(request: Request) {
  const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Check campaign name, message and audience', 400);
  const auth = await ownerContext();
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const { count, error: limitError } = await admin.from('campaigns').select('*',{head:true,count:'exact'})
    .eq('organization_id',auth.orgId!).gte('created_at',new Date(Date.now()-24*60*60_000).toISOString());
  if (limitError) return apiError('Could not check campaign limit',503);
  if ((count ?? 0) >= 10) return apiError('Limit: ten campaign drafts per organization per day',429);
  const { data, error } = await admin.from('campaigns').insert({
    organization_id:auth.orgId!, name:parsed.data.name,
    description:'WalletWallet · guest permission required', status:'draft',
    config: { channel:'wallet', audience:parsed.data.audience, message:parsed.data.message },
  }).select('id').single();
  if (error || !data) return apiError('Could not create campaign draft', 503);
  return NextResponse.json({ campaignId:data.id, status:'draft' },
    { status:201, headers:{'Cache-Control':'no-store'} });
}
