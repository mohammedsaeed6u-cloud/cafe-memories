import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ContextError, ContextResult } from '@/lib/server/context';
import { contextErrorResponse } from '@/lib/server/context';

/** JSON error with a stable machine code. Never includes provider messages. */
export function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    { ok: false, code, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200): NextResponse {
  return NextResponse.json(
    { ok: true, ...body },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Map a failed context resolution to its HTTP response. */
export function contextFailure(error: ContextError): NextResponse {
  return contextErrorResponse(error);
}

export function unwrapContext<T>(
  result: ContextResult<T>
): { context: T; error: null } | { context: null; error: ContextError } {
  return result.context ? { context: result.context, error: null } : { context: null, error: result.error! };
}

/**
 * Best-effort audit trail. An audit failure must never roll back the business
 * transaction it describes; the caller already committed the change.
 */
export async function writeAuditLog(input: {
  actorId: string | null;
  organizationId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    await createAdminClient()
      .from('audit_logs')
      .insert({
        actor_id: input.actorId ?? '00000000-0000-0000-0000-000000000000',
        organization_id: input.organizationId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
      });
  } catch {
    // Audit is observability, not the source of truth.
  }
}
