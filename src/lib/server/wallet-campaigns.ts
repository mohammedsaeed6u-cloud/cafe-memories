import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { payloadForWalletPass } from '@/lib/server/wallet-service';
import { updateWalletWalletPass } from '@/lib/server/walletwallet';

export type WalletAudience = 'all' | 'returning' | 'inactive30';
export type WalletCampaignConfig = { channel: 'wallet'; audience: WalletAudience; message: string };
export function walletCampaignConfig(value: unknown): WalletCampaignConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const config = value as Record<string, unknown>;
  if (config.channel !== 'wallet' || !['all','returning','inactive30'].includes(String(config.audience)) ||
    typeof config.message !== 'string' || config.message.length < 3 || config.message.length > 110) return null;
  return { channel: 'wallet', audience: config.audience as WalletAudience, message: config.message };
}

/** Reserve before network activity; never automatically resend unknown outcomes. */
export async function processWalletCampaignBatch(campaignId: string, config: WalletCampaignConfig) {
  const admin = createAdminClient();
  const { data: claims, error } = await admin.rpc('claim_wallet_campaign_delivery', {
    p_campaign: campaignId, p_limit: 5,
  });
  if (error) throw new Error('Campaign queue unavailable');
  let accepted = 0;
  let unknown = 0;
  for (const claim of claims ?? []) {
    let success = false;
    try {
      const { data: pass, error: passError } = await admin.from('wallet_passes')
        .select('organization_id,customer_id,connector_id,serial_number,status')
        .eq('id',claim.pass_id).single();
      if (passError || !pass || pass.status !== 'issued' || !pass.serial_number) throw new Error('Pass unavailable');
      // A guest can opt out while a batch runs. Re-check just before any provider
      // request. A request already in flight cannot be recalled from the OS.
      const [choices, campaign] = await Promise.all([
        admin.from('customer_wallet_preferences').select('wallet_opt_in,marketing_opt_in')
          .eq('organization_id',pass.organization_id).eq('customer_id',pass.customer_id).maybeSingle(),
        admin.from('campaigns').select('status').eq('id',campaignId).eq('organization_id',pass.organization_id).maybeSingle(),
      ]);
      if (choices.error || !choices.data?.wallet_opt_in || !choices.data.marketing_opt_in ||
        campaign.error || campaign.data?.status !== 'active') throw new Error('Campaign or permission withdrawn');
      const source = await payloadForWalletPass(pass.organization_id, pass.customer_id,
        pass.connector_id, config.message);
      await updateWalletWalletPass(source.apiKey, pass.serial_number, source.payload);
      success = true; // provider accepted a full update; NOT proof of device delivery.
    } catch {
      // Never auto-resend this campaign/pass. Unknown responses require human review.
    }
    const { data: finished, error: finishError } = await admin.rpc('finish_wallet_campaign_delivery', {
      p_delivery: claim.delivery_id, p_token: claim.token, p_revision: claim.revision,
      p_success: success,
    });
    if (finishError || !finished) throw new Error('Campaign acknowledgement needs manual review');
    if (success) accepted++;
    else unknown++;
  }
  return { claimed: claims?.length ?? 0, accepted, unknown };
}
