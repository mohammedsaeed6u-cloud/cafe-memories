import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireCustomer } from '@/lib/server/context';

const consentSchema = z.object({ memoryId: z.uuid(), liveWallConsent: z.boolean() });

/** A guest may only change consent for a memory attached to their auth user. */
export async function POST(request: Request) {
  const parsed = consentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid consent request', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const { error } = await auth.context.db.rpc('set_customer_wall_consent', {
    p_memory_id: parsed.data.memoryId, p_consent: parsed.data.liveWallConsent,
  });
  if (error) {
    if (error.code === '42501') return apiError('Memory not owned by this customer', 403);
    console.error('Consent transaction failed:', error);
    return apiError('Could not update consent', 503);
  }
  return NextResponse.json({ memoryId: parsed.data.memoryId, liveWallConsent: parsed.data.liveWallConsent },
    { headers: { 'Cache-Control': 'no-store' } });
}
