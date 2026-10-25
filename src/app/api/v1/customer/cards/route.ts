/**
 * GET /api/v1/customer/cards
 *
 * Every stamp card this browser has earned, one per venue. The signed customer
 * session holds tenant-scoped customer ids; this route only reads those ids,
 * never a phone number or a client-supplied identifier.
 *
 * The response is deliberately a summary: the full card (memories, vouchers,
 * ladder) is loaded by the venue page when the guest opens it.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk } from '@/lib/server/route-helpers';
import { readCustomerSession } from '@/lib/customer-session';
import { isBrandLogoKey } from '@/lib/brand';

export const runtime = 'nodejs';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  brand_tagline: string | null;
  status: string;
}

interface CustomerRow {
  id: string;
  organization_id: string | null;
  display_name: string | null;
  created_at: string;
  last_seen_at: string | null;
  organizations: OrganizationRow | OrganizationRow[] | null;
}

interface Balance {
  openStamps?: number;
  usedStamps?: number;
  availableRewards?: number;
  oldestRewardName?: string | null;
}

function embeddedOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
export async function GET(request: NextRequest) {
  const session = await readCustomerSession(request);
  if (!session) return jsonOk({ cards: [] });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customers')
    .select(
      'id,organization_id,display_name,created_at,last_seen_at,' +
        'organizations(id,name,slug,logo_url,primary_color,brand_tagline,status)'
    )
    .in('id', session.customerIds)
    .is('deleted_at', null);

  if (error) {
    console.error('customer cards read failed:', error.code ?? 'unknown');
    return jsonError(503, 'cards_unavailable', 'Cards are temporarily unavailable');
  }

  const rows = ((data ?? []) as unknown as CustomerRow[])
    .map((row) => ({ row, organization: embeddedOne(row.organizations) }))
    .filter(
      (entry): entry is { row: CustomerRow; organization: OrganizationRow } =>
        Boolean(entry.organization) && entry.organization?.status === 'active'
    )
    .sort((a, b) => (b.row.last_seen_at ?? '').localeCompare(a.row.last_seen_at ?? ''));

  if (rows.length === 0) return jsonOk({ cards: [] });

  const organizationIds = [...new Set(rows.map((entry) => entry.organization.id))];

  const [rulesResult, tiersResult, balances] = await Promise.all([
    admin
      .from('reward_rules')
      .select('organization_id,name,threshold')
      .in('organization_id', organizationIds)
      .eq('is_active', true)
      .eq('trigger_type', 'visit_count'),
    admin
      .from('reward_ladder_tiers')
      .select('organization_id,threshold,title')
      .in('organization_id', organizationIds)
      .eq('is_active', true)
      .order('threshold', { ascending: true }),
    Promise.all(
      rows.map((entry) =>
        admin.rpc('get_keepsake_balance', {
          p_customer_id: entry.row.id,
          p_organization_id: entry.organization.id,
        })
      )
    ),
  ]);

  const balanceError = balances.find((result) => result.error)?.error;
  if (rulesResult.error || tiersResult.error || balanceError) {
    console.error(
      'customer cards configuration read failed:',
      rulesResult.error?.code ?? tiersResult.error?.code ?? balanceError?.code ?? 'unknown'
    );
    return jsonError(503, 'cards_unavailable', 'Cards are temporarily unavailable');
  }

  const rules = new Map<string, { name: string; threshold: number }>();
  for (const rule of rulesResult.data ?? []) {
    rules.set(rule.organization_id, { name: rule.name, threshold: rule.threshold });
  }

  const tiers = new Map<string, Array<{ threshold: number; title: string }>>();
  for (const tier of tiersResult.data ?? []) {
    const list = tiers.get(tier.organization_id) ?? [];
    list.push({ threshold: tier.threshold, title: tier.title });
    tiers.set(tier.organization_id, list);
  }

  return jsonOk({
    cards: rows.map((entry, index) => {
      const balance = (balances[index]?.data ?? {}) as Balance;
      const openStamps = Number(balance.openStamps ?? 0);
      const rule = rules.get(entry.organization.id) ?? null;
      const nextTier =
        (tiers.get(entry.organization.id) ?? []).find((tier) => tier.threshold > openStamps) ??
        null;

      return {
        customerId: entry.row.id,
        displayName: entry.row.display_name ?? 'ضيف',
        venue: {
          name: entry.organization.name,
          slug: entry.organization.slug,
          tagline: entry.organization.brand_tagline,
          primaryColor: entry.organization.primary_color,
          logoUrl: isBrandLogoKey(entry.organization.logo_url, entry.organization.id)
            ? `/api/v1/brand/${entry.organization.id}/logo?v=${entry.organization.logo_url!.split('/').at(-1)}`
            : null,
        },
        openStamps,
        usedStamps: Number(balance.usedStamps ?? 0),
        availableRewards: Number(balance.availableRewards ?? 0),
        rewardName: rule?.name ?? balance.oldestRewardName ?? null,
        threshold: rule?.threshold ?? null,
        nextTier,
        lastSeenAt: entry.row.last_seen_at,
        memberSince: entry.row.created_at,
      };
    }),
  });
}
