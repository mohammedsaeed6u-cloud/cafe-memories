/**
 * Merchant loyalty rules.
 *
 * GET    list every rule for the organization (staff may read)
 * POST   create or update the single active visit-count rule
 * PATCH  edit a rule
 * DELETE deactivate a rule
 *
 * `ensure_keepsake_cards` snapshots the oldest active visit-count rule, so this
 * route keeps exactly one active rule per organization and lets the dashboard
 * edit it instead of silently stacking thresholds.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const REWARD_TYPES = [
  'free_item',
  'discount_percentage',
  'fixed_discount',
  'free_print',
  'bonus_visit',
  'custom',
] as const;

const ruleInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional().nullable(),
  threshold: z.number().int().min(2).max(30),
  rewardType: z.enum(REWARD_TYPES).default('free_item'),
  rewardValue: z.string().trim().max(120).optional().nullable(),
  rewardDescription: z.string().trim().max(300).optional().nullable(),
  isActive: z.boolean().default(true),
});

const patchSchema = ruleInput.partial().extend({ id: z.string().uuid() });

function shape(rule: Record<string, unknown>) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? null,
    threshold: rule.threshold,
    rewardType: rule.reward_type,
    rewardValue: rule.reward_value ?? null,
    rewardDescription: rule.reward_description ?? null,
    isActive: rule.is_active,
    startsAt: rule.starts_at,
    endsAt: rule.ends_at ?? null,
    createdAt: rule.created_at,
  };
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { data, error } = await createAdminClient()
    .from('reward_rules')
    .select(
      'id,name,description,threshold,reward_type,reward_value,reward_description,is_active,starts_at,ends_at,created_at'
    )
    .eq('organization_id', operator.organization.id)
    .eq('trigger_type', 'visit_count')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('reward rules lookup failed:', error.code ?? 'unknown');
    return jsonError(503, 'rewards_unavailable', 'Rewards are temporarily unavailable');
  }

  return jsonOk({
    rules: (data ?? []).map((rule) => shape(rule as Record<string, unknown>)),
    activeRule:
      (data ?? [])
        .filter((rule) => rule.is_active)
        .map((rule) => shape(rule as Record<string, unknown>))[0] ?? null,
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = ruleInput.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid reward rule');
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('reward_rules')
    .select('id')
    .eq('organization_id', operator.organization.id)
    .eq('trigger_type', 'visit_count')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const values = {
    name: input.name,
    description: input.description ?? null,
    threshold: input.threshold,
    reward_type: input.rewardType,
    reward_value: input.rewardValue ?? null,
    reward_description: input.rewardDescription ?? null,
    is_active: input.isActive,
    starts_at: new Date().toISOString(),
    ends_at: null,
    updated_at: new Date().toISOString(),
  };

  const query = existing?.id
    ? admin.from('reward_rules').update(values).eq('id', existing.id)
    : admin.from('reward_rules').insert({
        ...values,
        organization_id: operator.organization.id,
        trigger_type: 'visit_count',
      });

  const { data: rule, error } = await query
    .select(
      'id,name,description,threshold,reward_type,reward_value,reward_description,is_active,starts_at,ends_at,created_at'
    )
    .single();

  if (error || !rule) {
    console.error('reward rule save failed:', error?.code ?? 'unknown');
    return jsonError(503, 'reward_save_failed', 'Could not save the reward rule');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: existing?.id ? 'reward.rule_updated' : 'reward.rule_created',
    entityType: 'reward_rules',
    entityId: rule.id,
    metadata: { threshold: rule.threshold },
  });

  return jsonOk({ rule: shape(rule as Record<string, unknown>), updated: Boolean(existing?.id) });
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid reward update');
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('reward_rules')
    .select('id,organization_id,trigger_type')
    .eq('id', input.id)
    .maybeSingle();

  if (
    !current ||
    current.organization_id !== operator.organization.id ||
    current.trigger_type !== 'visit_count'
  ) {
    return jsonError(404, 'reward_not_found', 'Reward rule not found');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.threshold !== undefined) updates.threshold = input.threshold;
  if (input.rewardType !== undefined) updates.reward_type = input.rewardType;
  if (input.rewardValue !== undefined) updates.reward_value = input.rewardValue;
  if (input.rewardDescription !== undefined) updates.reward_description = input.rewardDescription;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data: rule, error } = await admin
    .from('reward_rules')
    .update(updates)
    .eq('id', current.id)
    .select(
      'id,name,description,threshold,reward_type,reward_value,reward_description,is_active,starts_at,ends_at,created_at'
    )
    .single();

  if (error || !rule) return jsonError(503, 'reward_save_failed', 'Could not save the reward rule');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'reward.rule_updated',
    entityType: 'reward_rules',
    entityId: rule.id,
    metadata: { fields: Object.keys(updates) },
  });

  return jsonOk({ rule: shape(rule as Record<string, unknown>) });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_id', 'A valid reward id is required');
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('reward_rules')
    .select('id,organization_id')
    .eq('id', id)
    .maybeSingle();

  if (!current || current.organization_id !== operator.organization.id) {
    return jsonError(404, 'reward_not_found', 'Reward rule not found');
  }

  const { error } = await admin
    .from('reward_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', current.id);

  if (error) return jsonError(503, 'reward_update_failed', 'Could not deactivate the reward rule');
  return jsonOk({ ruleId: current.id, isActive: false });
}
