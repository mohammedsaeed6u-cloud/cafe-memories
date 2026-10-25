/**
 * GET   /api/v1/merchant/discovery
 * PATCH /api/v1/merchant/discovery
 *
 * Public directory settings. Two scopes:
 *
 *   organization  category, opt-in, and the one-time head-start stamps
 *   branch        address, phone, coordinates, opening hours, amenities
 *
 * Discovery is off by default at the organization level, so nothing is listed
 * until the merchant explicitly opts in. Only active branches of an active
 * organization are ever returned by `public_nearby_venues`.
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
  DISCOVERY_AMENITY_IDS,
  DISCOVERY_CATEGORY_IDS,
  WEEKDAY_IDS,
  isValidOpeningWindow,
} from '@/lib/discovery';

export const runtime = 'nodejs';

const openingWindow = z
  .union([
    z.null(),
    z
      .object({
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .strict()
      .refine((value) => value.open !== value.close, 'Open and close must differ'),
  ])
  .refine(isValidOpeningWindow, 'Invalid opening window');

const organizationPatch = z
  .object({
    // The directory filters on these ids, so they are the write contract too.
    // Adding a category means adding it to `src/lib/discovery.ts` once.
    category: z.enum(DISCOVERY_CATEGORY_IDS).nullable().optional(),
    isDiscoverable: z.boolean().optional(),
    headStartStamps: z.number().int().min(0).max(10).optional(),
  })
  .strict();

const branchPatch = z
  .object({
    id: z.string().uuid(),
    isDiscoverable: z.boolean().optional(),
    description: z.string().trim().max(240).nullable().optional(),
    phone: z.string().trim().max(24).nullable().optional(),
    address: z.string().trim().max(200).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    openingHours: z.partialRecord(z.enum(WEEKDAY_IDS), openingWindow).optional(),
    amenities: z.array(z.enum(DISCOVERY_AMENITY_IDS)).max(8).optional(),
  })
  .strict();

const patchSchema = z
  .object({
    organization: organizationPatch.optional(),
    branch: branchPatch.optional(),
  })
  .strict();

interface BranchRow {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_discoverable: boolean;
  description: string | null;
  phone: string | null;
  opening_hours: Record<string, unknown> | null;
  amenities: string[] | null;
}

function serializeBranch(row: BranchRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    isDiscoverable: row.is_discoverable,
    description: row.description,
    phone: row.phone,
    openingHours: row.opening_hours ?? {},
    amenities: row.amenities ?? [],
  };
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const admin = createAdminClient();
  const [organization, branches] = await Promise.all([
    admin
      .from('organizations')
      .select('category,is_discoverable,head_start_stamps')
      .eq('id', operator.organization.id)
      .maybeSingle(),
    admin
      .from('branches')
      .select(
        'id,name,slug,address,latitude,longitude,is_discoverable,description,phone,opening_hours,amenities'
      )
      .eq('organization_id', operator.organization.id)
      .neq('status', 'retired')
      .order('created_at', { ascending: true }),
  ]);

  if (organization.error || !organization.data) {
    return jsonError(503, 'discovery_unavailable', 'Discovery settings are unavailable');
  }
  if (branches.error) {
    console.error('discovery branch read failed:', branches.error.code ?? 'unknown');
    return jsonError(503, 'discovery_unavailable', 'Discovery settings are unavailable');
  }

  return jsonOk({
    organization: {
      category: organization.data.category,
      isDiscoverable: organization.data.is_discoverable,
      headStartStamps: organization.data.head_start_stamps,
    },
    branches: ((branches.data ?? []) as BranchRow[]).map(serializeBranch),
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, 'invalid_discovery', 'Invalid discovery settings');
  }
  const { organization, branch } = parsed.data;
  if (!organization && !branch) {
    return jsonError(400, 'nothing_to_update', 'No discovery settings were supplied');
  }

  const admin = createAdminClient();
  const organizationId = operator.organization.id;
  const audit: Array<{ action: string; entityType: string; entityId: string }> = [];

  if (organization) {
    const updates: Record<string, unknown> = {};
    if (organization.category !== undefined) updates.category = organization.category;
    if (organization.isDiscoverable !== undefined) {
      updates.is_discoverable = organization.isDiscoverable;
    }
    if (organization.headStartStamps !== undefined) {
      updates.head_start_stamps = organization.headStartStamps;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await admin
        .from('organizations')
        .update(updates)
        .eq('id', organizationId);
      if (error) {
        console.error('discovery organization update failed:', error.code ?? 'unknown');
        return jsonError(503, 'discovery_update_failed', 'Could not save discovery settings');
      }
      audit.push({
        action: 'discovery.organization_updated',
        entityType: 'organizations',
        entityId: organizationId,
      });
    }
  }

  if (branch) {
    // A manager bound to one branch may only edit that branch.
    if (operator.branchId && operator.branchId !== branch.id) {
      return jsonError(403, 'branch_scope', 'This branch is outside your scope');
    }

    const { data: existing } = await admin
      .from('branches')
      .select('id,latitude,longitude')
      .eq('id', branch.id)
      .eq('organization_id', organizationId)
      .neq('status', 'retired')
      .maybeSingle();
    if (!existing) {
      return jsonError(404, 'branch_not_found', 'Branch not found');
    }

    // Coordinates are only useful as a pair; validate the merged result so a
    // partial patch cannot leave the branch with a latitude but no longitude.
    const nextLatitude =
      branch.latitude === undefined ? existing.latitude : branch.latitude;
    const nextLongitude =
      branch.longitude === undefined ? existing.longitude : branch.longitude;
    if ((nextLatitude === null) !== (nextLongitude === null)) {
      return jsonError(
        400,
        'invalid_coordinates',
        'Latitude and longitude must be set or cleared together'
      );
    }

    const updates: Record<string, unknown> = {};
    if (branch.isDiscoverable !== undefined) updates.is_discoverable = branch.isDiscoverable;
    if (branch.description !== undefined) updates.description = branch.description || null;
    if (branch.phone !== undefined) updates.phone = branch.phone || null;
    if (branch.address !== undefined) updates.address = branch.address || null;
    if (branch.latitude !== undefined) updates.latitude = branch.latitude;
    if (branch.longitude !== undefined) updates.longitude = branch.longitude;
    if (branch.openingHours !== undefined) updates.opening_hours = branch.openingHours;
    if (branch.amenities !== undefined) updates.amenities = branch.amenities;

    if (Object.keys(updates).length > 0) {
      const { error } = await admin
        .from('branches')
        .update(updates)
        .eq('id', branch.id)
        .eq('organization_id', organizationId);
      if (error) {
        console.error('discovery branch update failed:', error.code ?? 'unknown');
        return jsonError(503, 'discovery_update_failed', 'Could not save discovery settings');
      }
      audit.push({
        action: 'discovery.branch_updated',
        entityType: 'branches',
        entityId: branch.id,
      });
    }
  }

  for (const entry of audit) {
    await writeAuditLog({
      actorId: operator.memberId,
      organizationId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    });
  }

  return jsonOk({ saved: true });
}
