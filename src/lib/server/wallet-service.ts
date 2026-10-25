import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicBrand } from '@/lib/brand';
import { walletPassPayload, safeSiteOrigin } from '@/lib/wallet-pass';
import { openWalletKey } from '@/lib/server/wallet-crypto';
import { issueWalletWalletPass, updateWalletWalletPass } from '@/lib/server/walletwallet';
import { optionalEnv, requireEnv } from '@/lib/env';

export type WalletSyncResult = { state: 'idle' | 'synced' | 'pending' | 'failed'; processed: number };

type WalletPlan = 'free' | 'pro' | 'business';

const CONNECTOR_COLUMNS =
  'id,name,slug,status,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links';

/** Deployment-level plan; per-connector plans override it when present. */
function platformPlan(): WalletPlan {
  const configured = optionalEnv('WALLETWALLET_PLAN');
  return configured === 'pro' || configured === 'business' ? configured : 'free';
}

function platformKey(): string {
  const key = requireEnv('WALLETWALLET_API_KEY');
  if (!/^ww_live_[0-9a-f]{32}$/.test(key)) throw new Error('WALLETWALLET_API_KEY is invalid');
  return key;
}

/**
 * Whether this venue's wallet plan renders the notification/message field.
 *
 * A nudge only changes that field, so running one on a free plan would update
 * the pass and still show nothing to the customer. Campaign creation is gated
 * on this instead of silently recording a delivery that never happened.
 */
export async function walletMessagingAvailable(organizationId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: org, error } = await admin
    .from('organizations')
    .select('wallet_connector_id')
    .eq('id', organizationId)
    .maybeSingle();
  if (error || !org) return false;
  if (!org.wallet_connector_id) return platformPlan() !== 'free';

  const { data: connector, error: connectorError } = await admin
    .from('wallet_connectors')
    .select('plan,verified_at,enabled')
    .eq('id', org.wallet_connector_id)
    .maybeSingle();
  if (connectorError || !connector || !connector.enabled) return false;
  return (
    (connector.plan === 'pro' || connector.plan === 'business') &&
    connector.verified_at !== null &&
    Date.now() - new Date(connector.verified_at).getTime() < 24 * 60 * 60_000
  );
}

interface PayloadOptions {
  apiKey: string;
  plan: WalletPlan;
  verifiedAt: string | null;
  connectorId: string | null;
}

/**
 * Build the provider payload for one customer.
 *
 * A connector row is optional: when `connectorId` is null the deployment-level
 * `WALLETWALLET_API_KEY` is used with `WALLETWALLET_PLAN` (default free).
 */
export async function payloadForWalletPass(
  organizationId: string,
  customerId: string,
  connectorId: string | null,
  lastCampaignMessage: string,
  issuedPlan: string | null = null
) {
  const admin = createAdminClient();
  const [org, connector, preferences, visits, balance, rules, branches] = await Promise.all([
    admin
      .from('organizations')
      .select(CONNECTOR_COLUMNS)
      .eq('id', organizationId)
      .maybeSingle(),
    connectorId
      ? admin
          .from('wallet_connectors')
          .select('id,sealed_key,plan,verified_at,enabled')
          .eq('id', connectorId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin
      .from('customer_wallet_preferences')
      .select('wallet_opt_in,marketing_opt_in,nearby_opt_in')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .maybeSingle(),
    admin
      .from('visits')
      .select('*', { head: true, count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .eq('verification_status', 'verified'),
    admin.rpc('get_keepsake_balance', {
      p_customer_id: customerId,
      p_organization_id: organizationId,
    }),
    admin
      .from('reward_rules')
      .select('name,threshold')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('trigger_type', 'visit_count')
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(1),
    admin
      .from('branches')
      .select('latitude,longitude')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at')
      .limit(10),
  ]);

  if (
    org.error ||
    !org.data ||
    org.data.status !== 'active' ||
    connector.error ||
    preferences.error ||
    visits.error ||
    balance.error ||
    rules.error ||
    branches.error ||
    !balance.data ||
    typeof balance.data !== 'object' ||
    Array.isArray(balance.data)
  ) {
    throw new Error('Wallet data unavailable');
  }

  let plan: WalletPlan;
  let verifiedAt: string | null;
  let apiKey: string;

  if (connectorId) {
    if (!connector.data || !connector.data.enabled) throw new Error('Wallet connector unavailable');
    if (
      connector.data.plan !== 'free' &&
      (!connector.data.verified_at ||
        Date.now() - new Date(connector.data.verified_at).getTime() >= 24 * 60 * 60_000)
    ) {
      throw new Error('Wallet plan verification expired');
    }
    plan = ['pro', 'business'].includes(connector.data.plan)
      ? (connector.data.plan as WalletPlan)
      : 'free';
    verifiedAt = connector.data.verified_at;
    apiKey = openWalletKey(connector.data.sealed_key);
  } else {
    plan = platformPlan();
    // A platform key is not a per-tenant verified subscription, so custom
    // logo/locations/notification fields stay off unless explicitly Pro.
    verifiedAt = plan === 'free' ? null : new Date().toISOString();
    apiKey = platformKey();
  }

  if (issuedPlan && issuedPlan !== 'free' && plan === 'free') {
    throw new Error('Wallet plan downgrade needs administrator review');
  }
  if (plan !== 'free' && org.data.logo_url && !safeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? '')) {
    throw new Error('Public brand logo origin unavailable');
  }

  const usedVisits = (balance.data as { usedVisits?: unknown }).usedVisits;
  const openStamps = (balance.data as { openStamps?: unknown }).openStamps;
  if (typeof usedVisits !== 'number' || !Number.isSafeInteger(usedVisits)) {
    throw new Error('Wallet balance unavailable');
  }

  const rule = rules.data?.[0] ?? null;
  const payload = walletPassPayload({
    organizationId: org.data.id,
    organizationSlug: org.data.slug,
    customerId,
    brand: publicBrand(org.data),
    verifiedVisits: visits.count ?? 0,
    usedVisits,
    openStamps:
      typeof openStamps === 'number' && Number.isSafeInteger(openStamps) ? openStamps : undefined,
    threshold: rule?.threshold ?? null,
    rewardName: rule?.name ?? null,
    marketingOptIn: Boolean(preferences.data?.wallet_opt_in && preferences.data.marketing_opt_in),
    nearbyOptIn: Boolean(preferences.data?.wallet_opt_in && preferences.data.nearby_opt_in),
    lastCampaignMessage,
    plan,
    verifiedAt,
    siteOrigin: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    branches: branches.data ?? [],
  });

  return { apiKey, payload, plan };
}

export interface IssuedWalletPass {
  id: string;
  serialNumber: string;
  shareUrl: string;
  reused: boolean;
}

/**
 * Issue (or reuse) the wallet pass for a customer.
 *
 * The provider call is not idempotent across retries, so the row is reserved
 * first with `status = 'pending'`; a concurrent caller sees the reservation and
 * returns the same pass instead of creating a second serial.
 */
export async function issuePlatformWalletPass(
  organizationId: string,
  customerId: string
): Promise<IssuedWalletPass> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('wallet_passes')
    .select('id,status,serial_number,share_url')
    .eq('organization_id', organizationId)
    .eq('customer_id', customerId)
    .maybeSingle();

  if (existingError) throw new Error('Wallet pass unavailable');

  if (existing?.status === 'issued' && existing.serial_number && existing.share_url) {
    return {
      id: existing.id,
      serialNumber: existing.serial_number,
      shareUrl: existing.share_url,
      reused: true,
    };
  }

  let passId: string | null = typeof existing?.id === 'string' ? existing.id : null;
  if (!passId) {
    const { data: created, error: createError } = await admin
      .from('wallet_passes')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        connector_id: null,
        status: 'pending',
        issued_plan: platformPlan(),
      })
      .select('id')
      .single();
    if (createError || !created || typeof created.id !== 'string') {
      throw new Error('Wallet pass could not be reserved');
    }
    passId = created.id;
  }

  const source = await payloadForWalletPass(
    organizationId,
    customerId,
    null,
    ' ',
    existing?.status === 'issued' ? platformPlan() : null
  );
  const issued = await issueWalletWalletPass(source.apiKey, source.payload);

  const { error: updateError } = await admin
    .from('wallet_passes')
    .update({
      status: 'issued',
      serial_number: issued.serialNumber,
      share_url: issued.shareUrl,
      issued_plan: source.plan,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', passId);

  if (updateError) throw new Error('Wallet pass could not be stored');

  return {
    id: passId,
    serialNumber: issued.serialNumber,
    shareUrl: issued.shareUrl,
    reused: false,
  };
}

async function sourceForPass(passId: string) {
  const admin = createAdminClient();
  const { data: pass, error: passError } = await admin
    .from('wallet_passes')
    .select(
      'id,organization_id,customer_id,connector_id,status,issued_plan,serial_number,last_campaign_message'
    )
    .eq('id', passId)
    .maybeSingle();
  if (passError || !pass || pass.status !== 'issued' || !pass.serial_number) {
    throw new Error('Wallet pass unavailable');
  }
  return {
    serial: pass.serial_number,
    ...(await payloadForWalletPass(
      pass.organization_id,
      pass.customer_id,
      pass.connector_id,
      pass.last_campaign_message,
      pass.issued_plan
    )),
  };
}

async function syncStateForPass(passId: string, processed: number): Promise<WalletSyncResult> {
  const { data: pass, error } = await createAdminClient()
    .from('wallet_passes')
    .select('sync_revision,synced_revision,sync_error,sync_token')
    .eq('id', passId)
    .maybeSingle();
  if (error || !pass) throw new Error('Wallet sync status unavailable');
  return {
    state:
      pass.sync_revision > pass.synced_revision || pass.sync_error || pass.sync_token
        ? 'pending'
        : processed
          ? 'synced'
          : 'idle',
    processed,
  };
}

/** Claim/finish rows are atomic SQL RPCs. Safe to invoke after a stamp or by a cron worker. */
export async function processWalletSync(
  passId: string | null = null,
  max = 1
): Promise<WalletSyncResult> {
  const admin = createAdminClient();
  let processed = 0;
  for (let iteration = 0; iteration < Math.min(max, 4); iteration++) {
    const { data: claims, error: claimError } = await admin.rpc('claim_wallet_sync', {
      p_pass_id: passId,
    });
    if (claimError) throw new Error('Wallet outbox unavailable');
    const claim = claims?.[0];
    if (!claim) {
      return passId
        ? syncStateForPass(passId, processed)
        : { state: processed ? 'synced' : 'idle', processed };
    }
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
      p_pass_id: claim.pass_id,
      p_token: claim.token,
      p_revision: claim.revision,
      p_success: success,
      p_error: success ? null : 'Provider update unavailable',
    });
    if (finishError || !finished) throw new Error('Wallet sync acknowledgement failed');
    if (!success) return { state: 'failed', processed };
    processed++;
  }
  return passId
    ? syncStateForPass(passId, processed)
    : { state: processed ? 'synced' : 'pending', processed };
}

/** Queue brand and location changes without losing updates to issued passes. */
export async function queueOrganizationWalletSync(orgId: string) {
  const { error } = await createAdminClient().rpc('queue_wallet_sync', {
    p_org: orgId,
    p_customer: null,
  });
  if (error) throw new Error('Wallet resync could not be queued');
}

/** A stamp/reward is already committed. This best-effort kick never undoes it. */
export async function syncCustomerWalletAfterTransaction(orgId: string, customerId: string) {
  try {
    const admin = createAdminClient();
    const { data: pass, error } = await admin
      .from('wallet_passes')
      .select('id')
      .eq('organization_id', orgId)
      .eq('customer_id', customerId)
      .eq('status', 'issued')
      .maybeSingle();
    if (error) return 'pending' as const;
    if (!pass) return 'not-issued' as const;
    const result = await processWalletSync(pass.id, 3);
    return result.state === 'failed' || result.state === 'pending'
      ? ('pending' as const)
      : ('synced' as const);
  } catch {
    return 'pending' as const;
  }
}
