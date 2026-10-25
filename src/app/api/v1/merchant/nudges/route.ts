/**
 * POST /api/v1/merchant/nudges
 *
 * Wallet nudges. A nudge updates the customer's existing Apple/Google Wallet
 * pass; nothing is pushed, installed, or sent to a phone number. Delivery is
 * opt-in only (wallet + marketing), Pro only, and rate-limited to one nudge per
 * pass per 24 hours by `claim_wallet_campaign_delivery`.
 *
 * POST creates a campaign and processes a few batches. Call it again with the
 * same campaignId to continue; `done` is true when the audience is exhausted.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import {
  contextFailure,
  jsonError,
  jsonOk,
  readJson,
  writeAuditLog,
} from '@/lib/server/route-helpers';
import {
  processWalletCampaignBatch,
  walletCampaignConfig,
  type WalletAudience,
  type WalletCampaignConfig,
} from '@/lib/server/wallet-campaigns';
import { walletMessagingAvailable } from '@/lib/server/wallet-service';

export const runtime = 'nodejs';

const AUDIENCES: readonly WalletAudience[] = [
  'all',
  'returning',
  'inactive30',
  'reward_ready',
  'almost_there',
  'winback',
];

const schema = z.object({
  campaignId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  audience: z.enum(['all', 'returning', 'inactive30', 'reward_ready', 'almost_there', 'winback']),
  message: z.string().trim().min(3).max(110),
});

const BATCH_SIZE = 5;
const MAX_BATCHES_PER_REQUEST = 4;

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  config: Record<string, unknown> | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('campaigns')
    .select('id,name,status,config,created_at')
    .eq('organization_id', operator.organization.id)
    .eq('config->>channel', 'wallet')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('nudge list failed:', error.code ?? 'unknown');
    return jsonError(503, 'nudges_unavailable', 'Wallet nudges are temporarily unavailable');
  }

  const campaigns = (data ?? []) as CampaignRow[];
  const ids = campaigns.map((campaign) => campaign.id);
  const counts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: deliveries } = await admin
      .from('wallet_campaign_deliveries')
      .select('campaign_id,status')
      .in('campaign_id', ids);
    for (const delivery of deliveries ?? []) {
      const key = `${delivery.campaign_id}:${delivery.status}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return jsonOk({
    messagingAvailable: await walletMessagingAvailable(operator.organization.id),
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      audience: (campaign.config?.audience as string | undefined) ?? null,
      message: (campaign.config?.message as string | undefined) ?? null,
      createdAt: campaign.created_at,
      sent: counts.get(`${campaign.id}:sent`) ?? 0,
      unknown: counts.get(`${campaign.id}:unknown`) ?? 0,
      processing: counts.get(`${campaign.id}:processing`) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid wallet nudge');

  const admin = createAdminClient();
  const requestedCampaignId = parsed.data.campaignId ?? null;
  let campaignId: string;
  let config: WalletCampaignConfig;

  if (requestedCampaignId) {
    campaignId = requestedCampaignId;
    const { data } = await admin
      .from('campaigns')
      .select('id,status,config')
      .eq('id', campaignId)
      .eq('organization_id', operator.organization.id)
      .maybeSingle();
    if (!data) return jsonError(404, 'campaign_not_found', 'Campaign not found');
    if (data.status !== 'active') return jsonError(409, 'campaign_closed', 'Campaign is closed');
    const stored = walletCampaignConfig(data.config);
    if (!stored) return jsonError(409, 'campaign_invalid', 'Campaign configuration is invalid');
    config = stored;
  } else {
    if (!AUDIENCES.includes(parsed.data.audience)) {
      return jsonError(400, 'invalid_audience', 'Unknown audience');
    }
    // The message is a Pro wallet field. On a free plan the provider payload
    // omits it, so the campaign would mark passes as updated while the customer
    // sees nothing. Refuse up front instead of recording a silent no-op.
    if (!(await walletMessagingAvailable(operator.organization.id))) {
      return jsonError(
        409,
        'plan_required',
        'Wallet nudges require a Pro wallet plan for this venue'
      );
    }
    config = {
      channel: 'wallet',
      audience: parsed.data.audience,
      message: parsed.data.message,
    };

    const { data, error } = await admin
      .from('campaigns')
      .insert({
        organization_id: operator.organization.id,
        name: parsed.data.name ?? `Wallet nudge · ${parsed.data.audience}`,
        description: parsed.data.message,
        status: 'active',
        starts_at: new Date().toISOString(),
        config,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('nudge create failed:', error?.code ?? 'unknown');
      return jsonError(503, 'nudge_unavailable', 'Could not create the wallet nudge');
    }
    campaignId = data.id;

    await writeAuditLog({
      actorId: operator.memberId,
      organizationId: operator.organization.id,
      action: 'nudge.created',
      entityType: 'campaigns',
      entityId: campaignId,
      metadata: { audience: config.audience },
    });
  }

  let claimed = 0;
  let accepted = 0;
  let unknown = 0;
  let done = false;

  for (let batch = 0; batch < MAX_BATCHES_PER_REQUEST; batch += 1) {
    try {
      const progress = await processWalletCampaignBatch(campaignId, config);
      claimed += progress.claimed;
      accepted += progress.accepted;
      unknown += progress.unknown;
      if (progress.claimed < BATCH_SIZE) {
        done = true;
        break;
      }
    } catch {
      // A partially processed batch stays reserved for human review; never
      // resend automatically.
      return jsonOk({
        campaignId,
        claimed,
        accepted,
        unknown,
        done: false,
        needsReview: true,
        audience: config.audience,
      });
    }
  }

  return jsonOk({
    campaignId,
    claimed,
    accepted,
    unknown,
    done,
    audience: config.audience,
  });
}
