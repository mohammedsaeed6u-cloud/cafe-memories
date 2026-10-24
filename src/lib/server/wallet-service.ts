import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicBrand } from '@/lib/brand';
import { walletPassPayload, safeSiteOrigin } from '@/lib/wallet-pass';
import { openWalletKey } from '@/lib/server/wallet-crypto';
import { updateWalletWalletPass } from '@/lib/server/walletwallet';

export type WalletSyncResult = { state: 'idle' | 'synced' | 'pending' | 'failed'; processed: number };

export async function payloadForWalletPass(organizationId: string, customerId: string,
  connectorId: string, lastCampaignMessage: string, issuedPlan: string | null = null) {
  const admin = createAdminClient();
  const [org, connector, preferences, visits, balance, rules, branches] = await Promise.all([
    admin.from('organizations').select('id,name,slug,status,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links')
      .eq('id', organizationId).maybeSingle(),
    admin.from('wallet_connectors').select('id,sealed_key,plan,verified_at')
      .eq('id', connectorId).maybeSingle(),
    admin.from('customer_wallet_preferences').select('wallet_opt_in,marketing_opt_in,nearby_opt_in')
      .eq('organization_id', organizationId).eq('customer_id', customerId).maybeSingle(),
    admin.from('visits').select('*', { head: true, count: 'exact' })
      .eq('organization_id', organizationId).eq('customer_id', customerId).eq('verification_status','verified'),
    admin.rpc('get_keepsake_balance', { p_customer_id: customerId, p_organization_id: organizationId }),
    admin.from('reward_rules').select('name,threshold').eq('organization_id', organizationId)
      .eq('is_active', true).eq('trigger_type', 'visit_count')
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true }).limit(1),
    admin.from('branches').select('latitude,longitude').eq('organization_id', organizationId)
      .eq('status','active').order('created_at').limit(10),
  ]);
  if (org.error || !org.data || org.data.status === 'deleted' || connector.error || !connector.data ||
      preferences.error || visits.error || balance.error || rules.error || branches.error ||
      !balance.data || typeof balance.data !== 'object' || Array.isArray(balance.data)) {
    throw new Error('Wallet data unavailable');
  }
  // Do not silently strip a Pro card's notification anchor, logo or locations
  // merely because the 24h usage test expired. Defer and retry after re-test.
  if (connector.data.plan !== 'free' && (!connector.data.verified_at ||
    Date.now()-new Date(connector.data.verified_at).getTime() >= 24*60*60_000)) {
    throw new Error('Wallet plan verification expired');
  }
  if (issuedPlan && issuedPlan !== 'free' && connector.data.plan === 'free') {
    throw new Error('Wallet plan downgrade needs administrator review');
  }
  if (connector.data.plan !== 'free' && org.data.logo_url &&
    !safeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? '')) {
    throw new Error('Public brand logo origin unavailable');
  }
  const usedVisits = (balance.data as { usedVisits?: unknown }).usedVisits;
  if (typeof usedVisits !== 'number' || !Number.isSafeInteger(usedVisits)) throw new Error('Wallet balance unavailable');
  const rule = rules.data?.[0] ?? null;
  const payload = walletPassPayload({
    organizationId: org.data.id, organizationSlug: org.data.slug, customerId,
    brand: publicBrand(org.data), verifiedVisits: visits.count ?? 0, usedVisits,
    threshold: rule?.threshold ?? null, rewardName: rule?.name ?? null,
    marketingOptIn: Boolean(preferences.data?.wallet_opt_in && preferences.data.marketing_opt_in),
    nearbyOptIn: Boolean(preferences.data?.wallet_opt_in && preferences.data.nearby_opt_in),
    lastCampaignMessage, plan: ['pro','business'].includes(connector.data.plan)
      ? connector.data.plan as 'pro' | 'business' : 'free',
    verifiedAt: connector.data.verified_at, siteOrigin: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    branches: branches.data ?? [],
  });
  return { apiKey: openWalletKey(connector.data.sealed_key), payload };
}

async function sourceForPass(passId: string) {
  const admin = createAdminClient();
  const { data: pass, error: passError } = await admin.from('wallet_passes')
    .select('id,organization_id,customer_id,connector_id,status,issued_plan,serial_number,last_campaign_message')
    .eq('id', passId).maybeSingle();
  if (passError || !pass || pass.status !== 'issued' || !pass.serial_number) throw new Error('Wallet pass unavailable');
  return { serial: pass.serial_number,
    ...await payloadForWalletPass(pass.organization_id, pass.customer_id,
      pass.connector_id, pass.last_campaign_message, pass.issued_plan) };
}

async function syncStateForPass(passId: string, processed: number): Promise<WalletSyncResult> {
  const { data: pass, error } = await createAdminClient().from('wallet_passes')
    .select('sync_revision,synced_revision,sync_error,sync_token').eq('id', passId).maybeSingle();
  if (error || !pass) throw new Error('Wallet sync status unavailable');
  return { state: pass.sync_revision > pass.synced_revision || pass.sync_error || pass.sync_token
    ? 'pending' : processed ? 'synced' : 'idle', processed };
}

/** Claim/finish rows are atomic SQL RPCs. Safe to invoke after a stamp or by a cron worker. */
export async function processWalletSync(passId: string | null = null, max = 1): Promise<WalletSyncResult> {
  const admin = createAdminClient();
  let processed = 0;
  for (let iteration = 0; iteration < Math.min(max, 4); iteration++) {
    const { data: claims, error: claimError } = await admin.rpc('claim_wallet_sync', { p_pass_id: passId });
    if (claimError) throw new Error('Wallet outbox unavailable');
    const claim = claims?.[0];
    if (!claim) return passId ? syncStateForPass(passId, processed)
      : { state: processed ? 'synced' : 'idle', processed };
    let success = false;
    try {
      const source = await sourceForPass(claim.pass_id);
      await updateWalletWalletPass(source.apiKey, source.serial, source.payload);
      success = true;
    } catch {
      // A timeout has an unknown delivery outcome. Idempotent provider PUTs
      // are retried by the outbox, not counted as a campaign 'sent'.
    }
    const { data: finished, error: finishError } = await admin.rpc('finish_wallet_sync', {
      p_pass_id: claim.pass_id, p_token: claim.token, p_revision: claim.revision,
      p_success: success, p_error: success ? null : 'Provider update unavailable',
    });
    if (finishError || !finished) throw new Error('Wallet sync acknowledgement failed');
    if (!success) return { state: 'failed', processed };
    processed++;
  }
  return passId ? syncStateForPass(passId, processed)
    : { state: processed ? 'synced' : 'pending', processed };
}

/** Queue brand and location changes without losing updates to issued passes. */
export async function queueOrganizationWalletSync(orgId: string) {
  const { error } = await createAdminClient().rpc('queue_wallet_sync', { p_org: orgId, p_customer: null });
  if (error) throw new Error('Wallet resync could not be queued');
}

/** A stamp/reward is already committed. This best-effort kick never undoes it. */
export async function syncCustomerWalletAfterTransaction(orgId: string, customerId: string) {
  try {
    const admin = createAdminClient();
    const { data: pass, error } = await admin.from('wallet_passes').select('id')
      .eq('organization_id', orgId).eq('customer_id', customerId).eq('status', 'issued').maybeSingle();
    if (error) return 'pending' as const;
    if (!pass) return 'not-issued' as const;
    const result = await processWalletSync(pass.id, 3);
    return result.state === 'failed' || result.state === 'pending' ? 'pending' as const : 'synced' as const;
  } catch { return 'pending' as const; }
}
