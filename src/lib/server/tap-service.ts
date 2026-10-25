import 'server-only';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { hashReaderSecret, readerSecretMatches } from '@/lib/server/nfc';

/**
 * Shared plumbing for the public NFC surfaces.
 *
 * Two things must be true before a tap can touch loyalty data:
 *   1. the URL fragment proves the caller scanned the physical tag;
 *   2. the request carries a server-signed customer session.
 *
 * The session is minted on the first tap. A customer row is tenant-scoped, so
 * scanning a tag at a second venue starts a fresh card instead of sharing an
 * identity across businesses.
 */

export interface TapReader {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  branchId: string;
  branchName: string;
  branchSlug: string;
}

interface EmbeddedRow {
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
}

function embeddedOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function resolveTapReader(
  publicId: string,
  secret: string
): Promise<TapReader | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('nfc_readers')
    .select(
      'id,organization_id,branch_id,status,secret_hash,' +
        'organizations!inner(id,name,slug,status),branches!inner(id,name,slug,status)'
    )
    .eq('public_id', publicId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown>;
  if (row.status !== 'active') return null;
  if (!readerSecretMatches(secret, String(row.secret_hash))) return null;

  const organization = embeddedOne(row.organizations as EmbeddedRow | EmbeddedRow[]);
  const branch = embeddedOne(row.branches as EmbeddedRow | EmbeddedRow[]);

  if (
    !organization ||
    !branch ||
    organization.status !== 'active' ||
    branch.status !== 'active'
  ) {
    return null;
  }

  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    organizationName: String(organization.name ?? ''),
    organizationSlug: String(organization.slug ?? ''),
    branchId: String(row.branch_id),
    branchName: String(branch.name ?? ''),
    branchSlug: String(branch.slug ?? ''),
  };
}

export interface TapCustomer {
  customerId: string;
  /** True when this request created the row and must set the session cookie. */
  minted: boolean;
  /** True when the venue's existing card is not the most recently used one. */
  activeCardChanged: boolean;
}

export async function ensureTapCustomer(
  request: NextRequest,
  organizationId: string
): Promise<TapCustomer> {
  const admin = createAdminClient();
  const claims = await readCustomerSession(request);

  if (claims) {
    // A guest has one card per organization. Search every card in the cookie,
    // not just the last used one, so alternating between venues reuses the
    // existing card instead of minting a duplicate.
    const { data: rows } = await admin
      .from('customers')
      .select('id,organization_id')
      .in('id', claims.customerIds)
      .is('deleted_at', null);

    const existing = (rows ?? []).find(
      (row) => !row.organization_id || row.organization_id === organizationId
    );

    if (existing) {
      await admin
        .from('customers')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);
      return {
        customerId: existing.id,
        minted: false,
        activeCardChanged: existing.id !== claims.customerId,
      };
    }
  }

  const anonymousId = `guest_${crypto.randomUUID()}`;
  const { data: inserted, error } = await admin
    .from('customers')
    .insert({
      anonymous_id: anonymousId,
      organization_id: organizationId,
      display_name: 'ضيف',
    })
    .select('id')
    .single();

  if (error || !inserted) throw new Error('Tap customer creation failed');

  await admin.from('customer_identities').insert({
    customer_id: inserted.id,
    provider: 'anonymous',
    provider_subject: anonymousId,
  });

  return { customerId: inserted.id, minted: true, activeCardChanged: false };
}

/** Reader hash for the RPC. The plaintext secret never leaves the request. */
export function readerHash(secret: string): string {
  return hashReaderSecret(secret);
}

export interface TapReceipt {
  id: string;
  kind: string;
  status: string;
  stampsAwarded: number;
  multiplier: number;
  rewardKind: string | null;
  rewardId: string | null;
  result: Record<string, unknown>;
  createdAt: string;
  venue: { name: string; slug: string; branchName: string } | null;
}

export async function loadTapReceipt(
  tapId: string,
  customerId: string
): Promise<TapReceipt | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tap_events')
    .select(
      'id,kind,status,stamps_awarded,multiplier,reward_kind,reward_id,result,created_at,' +
        'organizations(name,slug),branches(name)'
    )
    .eq('id', tapId)
    .eq('customer_id', customerId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown>;

  const organization = embeddedOne(row.organizations as EmbeddedRow | EmbeddedRow[]);
  const branch = embeddedOne(row.branches as EmbeddedRow | EmbeddedRow[]);

  return {
    id: String(row.id),
    kind: String(row.kind),
    status: String(row.status),
    stampsAwarded: Number(row.stamps_awarded ?? 0),
    multiplier: Number(row.multiplier ?? 1),
    rewardKind: row.reward_kind ? String(row.reward_kind) : null,
    rewardId: row.reward_id ? String(row.reward_id) : null,
    result: (row.result ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    venue: organization
      ? {
          name: String(organization.name ?? ''),
          slug: String(organization.slug ?? ''),
          branchName: branch ? String(branch.name ?? '') : '',
        }
      : null,
  };
}
