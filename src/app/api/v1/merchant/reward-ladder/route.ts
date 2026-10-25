/**
 * GET/PUT /api/v1/merchant/reward-ladder
 *
 * A reward ladder is several rewards on one stamp card. Exactly one tier is the
 * card reward (the cycle target); every lower tier is a voucher that is granted
 * once per cycle without resetting the card.
 *
 * The write is a single SQL transaction: tiers are replaced atomically and the
 * base reward rule is kept in sync with the top "card" tier, so allocation and
 * the ladder can never disagree about the cycle target.
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

export const runtime = 'nodejs';

const tierSchema = z.object({
  threshold: z.number().int().min(2).max(30),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(240).optional().nullable(),
  rewardKind: z.enum(['voucher', 'card']).default('voucher'),
  voucherValidDays: z.number().int().min(1).max(365).default(30),
  isActive: z.boolean().default(true),
});

const ladderSchema = z.object({
  tiers: z.array(tierSchema).min(1).max(5),
});

interface TierRow {
  id: string;
  threshold: number;
  title: string;
  description: string | null;
  reward_kind: 'voucher' | 'card';
  voucher_valid_days: number;
  is_active: boolean;
}

function shapeTier(tier: TierRow) {
  return {
    id: tier.id,
    threshold: tier.threshold,
    title: tier.title,
    description: tier.description,
    rewardKind: tier.reward_kind,
    voucherValidDays: tier.voucher_valid_days,
    isActive: tier.is_active,
  };
}

async function loadTiers(organizationId: string) {
  const { data, error } = await createAdminClient()
    .from('reward_ladder_tiers')
    .select('id,threshold,title,description,reward_kind,voucher_valid_days,is_active')
    .eq('organization_id', organizationId)
    .order('threshold', { ascending: true });
  if (error) throw new Error('Ladder lookup failed');
  return ((data ?? []) as TierRow[]).map(shapeTier);
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  try {
    const tiers = await loadTiers(operator.organization.id);
    return jsonOk({
      tiers,
      cycleThreshold: tiers.find((tier) => tier.rewardKind === 'card')?.threshold ?? null,
    });
  } catch {
    return jsonError(503, 'ladder_unavailable', 'Reward ladder is temporarily unavailable');
  }
}

export async function PUT(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = ladderSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid reward ladder');

  const { data, error } = await createAdminClient().rpc('replace_reward_ladder', {
    p_organization_id: operator.organization.id,
    p_tiers: parsed.data.tiers,
  });

  if (error) {
    if (error.code === '22023') {
      return jsonError(
        400,
        'invalid_ladder',
        'Use 1–5 tiers, exactly one card reward, and put the card at the highest threshold'
      );
    }
    console.error('replace_reward_ladder failed:', error.code ?? 'unknown');
    return jsonError(503, 'ladder_unavailable', 'Could not save the reward ladder');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'ladder.replaced',
    entityType: 'reward_ladder_tiers',
    metadata: { tiers: parsed.data.tiers.length },
  });

  const payload = (data ?? {}) as Record<string, unknown>;
  return jsonOk({
    tiers: Array.isArray(payload.tiers) ? payload.tiers : await loadTiers(operator.organization.id),
    cycleThreshold: payload.cycleThreshold ?? null,
  });
}
