import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
/* eslint-disable @typescript-eslint/no-explicit-any -- the generated Database
   type in @/types/database does not yet cover every table/column used by the
   API routes; routes rely on the loose typing until it is regenerated. */

let sharedAdminClient: SupabaseClient<any> | null = null;

/**
 * Shared admin (service-role) Supabase client.
 *
 * One client (and its connection pool) is reused across all requests instead
 * of building a new instance per call. Created lazily on first use so that
 * importing this module stays side-effect free (unit tests import callers of
 * this function without env vars configured).
 */
export function createAdminClient(): SupabaseClient<any> {
  if (!sharedAdminClient) {
    sharedAdminClient = createSupabaseClient<any>(
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
