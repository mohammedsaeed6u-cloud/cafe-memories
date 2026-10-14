import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let sharedAdminClient: SupabaseClient<Database> | null = null;

/**
 * Shared admin (service-role) Supabase client.
 *
 * One client (and its connection pool) is reused across all requests instead
 * of building a new instance per call. Created lazily on first use so that
 * importing this module stays side-effect free (unit tests import callers of
 * this function without env vars configured).
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (!sharedAdminClient) {
    sharedAdminClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return sharedAdminClient;
}
