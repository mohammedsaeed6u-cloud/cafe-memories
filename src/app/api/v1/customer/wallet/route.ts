import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireCustomer } from '@/lib/server/context';
import { walletEncryptionReady, openWalletKey } from '@/lib/server/wallet-crypto';
import { issueWalletWalletPass, revokeWalletWalletPass, validateInstallLink } from '@/lib/server/walletwallet';
import { payloadForWalletPass, processWalletSync } from '@/lib/server/wallet-service';
import { safeSiteOrigin } from '@/lib/wallet-pass';

export const runtime = 'nodejs';
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/);
const issueSchema = z.object({ cafeSlug: slug, walletConsent: z.literal(true),
  marketingConsent: z.boolean(), nearbyConsent: z.boolean() }).strict();
const preferencesSchema = z.object({ cafeSlug: slug, marketingConsent: z.boolean(),
  nearbyConsent: z.boolean() }).strict();

async function venue(cafeSlug: string) {
  return createAdminClient().from('organizations')
    .select('id,name,status,logo_url,wallet_connector_id').eq('slug', cafeSlug).maybeSingle();
}
const verifiedRecently = (stamp: string | null) => Boolean(stamp &&
  Date.now() - new Date(stamp).getTime() < 24 * 60 * 60_000);
const brandMarkReady = (plan: string | null, logo: string | null) =>
  plan === 'free' || !logo || Boolean(safeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? ''));

/** Only the authenticated guest can see an issued pass link. No photos are sent to WalletWallet. */
export async function GET(request: NextRequest) {
  const parsed = slug.safeParse(request.nextUrl.searchParams.get('cafeSlug'));
  if (!parsed.success) return apiError('Invalid business', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const org = await venue(parsed.data);
  if (org.error || !org.data) return apiError('Business unavailable', org.error ? 503 : 404);
  const admin = createAdminClient();
  const [prefs, pass, connector] = await Promise.all([
    admin.from('customer_wallet_preferences').select('wallet_opt_in,marketing_opt_in,nearby_opt_in')
      .eq('organization_id', org.data.id).eq('customer_id', auth.context.customerId).maybeSingle(),
    admin.from('wallet_passes').select('id,status,issued_plan,serial_number,share_url,connector_id,sync_revision,synced_revision,sync_error')
      .eq('organization_id', org.data.id).eq('customer_id', auth.context.customerId).maybeSingle(),
    org.data.wallet_connector_id ? admin.from('wallet_connectors').select('id,plan,enabled,verified_at')
      .eq('id', org.data.wallet_connector_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (prefs.error || pass.error || connector.error) return apiError('Could not load wallet', 503);
  const current = pass.data;
  const pinned = current?.connector_id ? await admin.from('wallet_connectors')
    .select('plan,verified_at').eq('id',current.connector_id).maybeSingle() : null;
  if (pinned?.error) return apiError('Could not load card settings',503);
  const shareUrl = current?.status === 'issued' && current.serial_number && current.share_url
    ? validateInstallLink(current.share_url, current.serial_number) : null;
  const configured = org.data.status === 'active' && walletEncryptionReady() && Boolean(
    connector.data?.enabled && verifiedRecently(connector.data.verified_at) &&
    brandMarkReady(connector.data.plan, org.data.logo_url));
  return NextResponse.json({ available: configured, plan: pinned?.data?.plan ?? connector.data?.plan ?? null,
    reason: org.data.status !== 'active' ? 'المكان غير نشط الآن' : !org.data.wallet_connector_id
      ? 'مسؤول المنصة لم يربط WalletWallet بهذا المكان بعد' : !walletEncryptionReady()
        ? 'التشفير غير مضبوط على الخادم' : connector.data &&
          !brandMarkReady(connector.data.plan, org.data.logo_url)
          ? 'مسؤول المنصة يحتاج إعداد رابط HTTPS عام للوجو المشترك' : !configured
            ? 'مسؤول المنصة يحتاج اختبار اتصال WalletWallet' : null,
    pass: current ? { status: current.status, shareUrl,
      marketingAvailable: current.issued_plan !== 'free' &&
        ['pro','business'].includes(pinned?.data?.plan ?? '') &&
        verifiedRecently(pinned?.data?.verified_at ?? null),
      revocationRequested: current.status === 'needs_review' && Boolean(current.serial_number),
      syncPending: current.sync_revision > current.synced_revision || Boolean(current.sync_error) } : null,
    preferences: { walletConsent: prefs.data?.wallet_opt_in ?? false,
      marketingConsent: prefs.data?.marketing_opt_in ?? false,
      nearbyConsent: prefs.data?.nearby_opt_in ?? false },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/** A single, non-retryable POST reserves the guest/org row before provider issuance. */
export async function POST(request: Request) {
  const parsed = issueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Explicit wallet permission is required', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const org = await venue(parsed.data.cafeSlug);
  if (org.error || !org.data) return apiError('Business unavailable', org.error ? 503 : 404);
  if (org.data.status !== 'active' || !org.data.wallet_connector_id || !walletEncryptionReady()) {
    return apiError('Wallet is not ready for this business', 503);
  }
  const admin = createAdminClient();
  const [{ data: connector, error: connError }, { data: existing, error: existingError }] = await Promise.all([
    admin.from('wallet_connectors').select('id,plan,enabled,verified_at').eq('id', org.data.wallet_connector_id).maybeSingle(),
    admin.from('wallet_passes').select('status').eq('organization_id', org.data.id)
      .eq('customer_id', auth.context.customerId).maybeSingle(),
  ]);
  if (connError || existingError || !connector?.enabled || !verifiedRecently(connector.verified_at)) {
    return apiError('WalletWallet must be tested by the platform administrator first', 503);
  }
  if (!brandMarkReady(connector.plan, org.data.logo_url)) {
    return apiError('Set an HTTPS site origin before issuing a co-branded Wallet logo', 503);
  }
  if (existing) return apiError('This guest already has or previously requested a Wallet pass; open your card or contact support', 409);
  if ((parsed.data.marketingConsent || parsed.data.nearbyConsent) && connector.plan === 'free') {
    return apiError('Campaign and nearby features require WalletWallet Pro or higher', 409);
  }
  if (parsed.data.nearbyConsent) {
    const { data: locations, error } = await admin.from('branches').select('id')
      .eq('organization_id', org.data.id).eq('status','active').not('latitude','is',null).not('longitude','is',null)
      .limit(1);
    if (error || !locations?.length) return apiError('The business must add branch coordinates before enabling nearby notices', 409);
  }
  const { error: prefError } = await admin.from('customer_wallet_preferences').upsert({
    organization_id: org.data.id, customer_id: auth.context.customerId, wallet_opt_in: true,
    marketing_opt_in: parsed.data.marketingConsent, nearby_opt_in: parsed.data.nearbyConsent,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,customer_id' });
  if (prefError) return apiError('Could not save wallet permission', 503);
  let source: Awaited<ReturnType<typeof payloadForWalletPass>>;
  try { source = await payloadForWalletPass(org.data.id, auth.context.customerId, connector.id, ' '); }
  catch { return apiError('Could not prepare real Wallet pass', 503); }
  const reservation = await admin.from('wallet_passes').insert({
    organization_id: org.data.id, customer_id: auth.context.customerId,
    connector_id: connector.id, status: 'pending', issued_plan:connector.plan,
  }).select('id').single();
  if (reservation.error || !reservation.data) return apiError('Wallet pass already requested; check your card', 409);
  try {
    const issued = await issueWalletWalletPass(source.apiKey, source.payload);
    const { data: saved, error: stored } = await admin.from('wallet_passes').update({
      status: 'issued', serial_number: issued.serialNumber, share_url: issued.shareUrl,
      last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', reservation.data.id).eq('status', 'pending').select('id').maybeSingle();
    if (stored || !saved) throw new Error('Wallet issuance must be reconciled by administrator');
    return NextResponse.json({ shareUrl: issued.shareUrl, issued: true },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    await admin.from('wallet_passes').update({ status: 'needs_review',
      sync_error: 'Provider outcome unknown; administrator review required',
      updated_at: new Date().toISOString(),
    }).eq('id', reservation.data.id).eq('status','pending');
    return apiError('Wallet request may have reached the provider. Contact support; do not issue twice', 503);
  }
}

/** Guest controls marketing and location independently; changes queue an actual pass update. */
export async function PATCH(request: Request) {
  const parsed = preferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid preferences', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const org = await venue(parsed.data.cafeSlug);
  if (org.error || !org.data) return apiError('Business unavailable', org.error ? 503 : 404);
  const admin = createAdminClient();
  const { data: pass, error } = await admin.from('wallet_passes')
    .select('id,status,connector_id,issued_plan,last_campaign_message').eq('customer_id', auth.context.customerId)
    .eq('organization_id', org.data.id).maybeSingle();
  if (error || !pass || pass.status !== 'issued') return apiError('Issue your Wallet pass first', 409);
  if (parsed.data.marketingConsent && pass.issued_plan === 'free') {
    return apiError('This pass was issued on a Free plan without a notification anchor; ask support about safe re-issuance',409);
  }
  if (parsed.data.marketingConsent || parsed.data.nearbyConsent) {
    const conn = await admin.from('wallet_connectors').select('plan,verified_at').eq('id',pass.connector_id).single();
    if (conn.error || !conn.data || conn.data.plan === 'free' || !verifiedRecently(conn.data.verified_at)) {
      return apiError('WalletWallet Pro and a recent provider test are required for these notices', 409);
    }
  }
  if (parsed.data.nearbyConsent) {
    const { data: branches } = await admin.from('branches').select('id')
      .eq('organization_id', org.data.id).eq('status','active').not('latitude','is',null).not('longitude','is',null).limit(1);
    if (!branches?.length) return apiError('No branch coordinates configured', 409);
  }
  const { error: prefError } = await admin.from('customer_wallet_preferences').upsert({
    organization_id: org.data.id, customer_id: auth.context.customerId, wallet_opt_in: true,
    marketing_opt_in: parsed.data.marketingConsent, nearby_opt_in: parsed.data.nearbyConsent,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,customer_id' });
  if (prefError) return apiError('Could not save your choices', 503);
  if (!parsed.data.marketingConsent && pass.last_campaign_message !== ' ') {
    const { error: clearError } = await admin.from('wallet_passes')
      .update({ last_campaign_message: ' ' }).eq('id', pass.id);
    if (clearError) return apiError('Choice saved, but last campaign message could not be cleared; contact support',503);
    const { error: queueError } = await admin.rpc('queue_wallet_sync', {
      p_org:org.data.id,p_customer:auth.context.customerId });
    if (queueError) return apiError('Choice saved, but Wallet removal could not be queued; contact support',503);
  }
  try {
    const result = await processWalletSync(pass.id, 2);
    return NextResponse.json({ saved: true, synced: result.state === 'synced' || result.state === 'idle',
      note: result.state === 'failed' || result.state === 'pending'
        ? 'طلب التحديث محفوظ لكن لم يصل بعد. أزل البطاقة من جهازك لإيقاف تنبيهات القرب فورًا؛ سيعيد الخادم المحاولة.' : null,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ saved: true, synced: false,
      note: 'تعذر تحديث البطاقة عند المزوّد الآن؛ يمكن إزالتها من Wallet لإيقاف التنبيهات فورًا.' },
    { headers: { 'Cache-Control': 'private, no-store' } });
  }
}

/** Revocation goes to the provider. On timeout, don't claim the pass is gone. */
export async function DELETE(request: Request) {
  const parsed = z.object({ cafeSlug: slug }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid business', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const org = await venue(parsed.data.cafeSlug);
  if (org.error || !org.data) return apiError('Business unavailable', org.error ? 503 : 404);
  const admin = createAdminClient();
  const { data: pass, error: passError } = await admin.from('wallet_passes')
    .select('id,status,serial_number,connector_id')
    .eq('organization_id',org.data.id).eq('customer_id',auth.context.customerId).maybeSingle();
  if (passError) return apiError('Could not find wallet pass',503);
  if (!pass || !pass.serial_number || !['issued','needs_review'].includes(pass.status)) {
    return apiError('No issued pass to revoke', 404);
  }
  // Stop NEW marketing and nearby eligibility immediately, even if the remote
  // DELETE times out. Do not pretend an in-flight OS notification is recalled.
  const { error: prefError } = await admin.from('customer_wallet_preferences').update({
    wallet_opt_in:false, marketing_opt_in:false, nearby_opt_in:false,
    updated_at:new Date().toISOString(),
  }).eq('organization_id',org.data.id).eq('customer_id',auth.context.customerId);
  if (prefError) return apiError('Could not withdraw wallet consent',503);
  const { data: held, error: holdError } = await admin.from('wallet_passes').update({
    status:'needs_review', share_url:null, sync_error:'Revocation requested; provider outcome pending',
    updated_at:new Date().toISOString(),
  }).eq('id',pass.id).in('status',['issued','needs_review']).select('id').maybeSingle();
  if (holdError || !held) return apiError('Permission saved, but revocation needs support; remove pass on device',503);
  const { data: connector } = await admin.from('wallet_connectors').select('sealed_key')
    .eq('id', pass.connector_id).maybeSingle();
  if (!connector || !walletEncryptionReady()) return apiError('Provider connection unavailable; remove pass on device and contact support', 503);
  try {
    await revokeWalletWalletPass(openWalletKey(connector.sealed_key), pass.serial_number);
    const { data: updated, error: updateError } = await admin.from('wallet_passes').update({
      status:'revoked', share_url:null, sync_error:null, updated_at:new Date().toISOString(),
    }).eq('id',pass.id).eq('status','needs_review').select('id').maybeSingle();
    if (updateError || !updated) return apiError('Provider revoked, but local state needs administrator review', 503);
    return NextResponse.json({ revoked: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return apiError('Could not confirm revocation. Consent withdrawn locally; remove pass on device and contact support', 503);
  }
}
