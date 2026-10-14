import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/server/context';

/** Always verify a fresh Supabase user and the platform role before service-role reads. */
export async function requirePlatformAdmin() {
  try {
    const db = await createClient();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user || user.is_anonymous) return { error: apiError('Sign in required', 401) } as const;
    const { data: profile, error: profileError } = await db.from('users')
      .select('role').eq('id', user.id).maybeSingle();
    if (profileError) return { error: apiError('Could not check administrator', 503) } as const;
    if (profile?.role !== 'admin') return { error: apiError('Platform admin required', 403) } as const;
    return { userId: user.id, error: null } as const;
  } catch (error) {
    console.error('Platform authentication failed:', error);
    return { error: apiError('Authentication unavailable', 503) } as const;
  }
}
