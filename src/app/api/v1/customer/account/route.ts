import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer, apiError } from '@/lib/server/context';

const accountSchema = z.object({
  authUserId: z.string().uuid(), // Reject a stale settings form after sign-in changes in another tab.
  displayName: z.string().trim().min(2).max(80).refine((value) => !/\p{Cc}/u.test(value)),
  // Contact only. It is not verified and never identifies a guest or awards visits.
  phone: z.string().trim().regex(/^[+]?[0-9]{8,15}$/).nullable(),
}).strict();

/** Only the authenticated owner may change their name or private contact number. */
export async function PATCH(request: Request) {
  const parsed = accountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Valid name and optional contact number required', 400);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  if (auth.context.userId !== parsed.data.authUserId) return apiError('Account changed; reload before saving', 409);
  try {
    const { error } = await auth.context.db.rpc('set_customer_account', {
      p_display_name: parsed.data.displayName, p_phone: parsed.data.phone,
    });
    if (error) {
      if (error.code === '42501') return apiError('Customer account not found', 403);
      if (error.code === '22023' || error.code === '23514') return apiError('Invalid account settings', 400);
      console.error('Customer settings failed:', error);
      return apiError('Could not save account settings', 503);
    }
    return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Customer settings unavailable:', error);
    return apiError('Could not save account settings', 503);
  }
}
