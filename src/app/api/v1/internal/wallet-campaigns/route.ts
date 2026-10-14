import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { processWalletCampaignBatch, walletCampaignConfig } from '@/lib/server/wallet-campaigns';

export const runtime = 'nodejs';

/** Cron only; merchant sends the initial batch, this continues an active campaign. */
export async function POST(request: Request) {
  const secret = process.env.WALLET_SYNC_CRON_SECRET;
  if (!secret || secret.length < 32) return apiError('Wallet worker unavailable',503);
  const expected = Buffer.from(secret);
  const supplied = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer /,'') ?? '');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) return apiError('Unauthorized',401);
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin.from('campaigns')
    .select('id,status,config').eq('status','active').order('updated_at',{ascending:true}).limit(2);
  if (error) return apiError('Campaign worker unavailable',503);
  let claimed = 0; let accepted = 0; let unknown = 0;
  try {
    for (const campaign of campaigns ?? []) {
      const config = walletCampaignConfig(campaign.config);
      if (!config) continue;
      const result = await processWalletCampaignBatch(campaign.id,config);
      claimed += result.claimed; accepted += result.accepted; unknown += result.unknown;
      // Rotate batches across ongoing campaigns rather than starving newer ones.
      await admin.from('campaigns').update({updated_at:new Date().toISOString()})
        .eq('id',campaign.id).eq('status','active');
    }
    return NextResponse.json({claimed,accepted,unknown}, {headers:{'Cache-Control':'no-store'}});
  } catch { return apiError('Campaign worker needs attention; no unknown delivery is resent automatically',503); }
}
