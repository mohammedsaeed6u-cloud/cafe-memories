/**
 * Auth adapter.
 *
 * The product uses Supabase Auth today. Route handlers depend on this small
 * interface (`auth.api.getSession`) instead of importing a vendor SDK directly,
 * so swapping the identity provider later does not touch every route.
 */

import { createClient } from '@/lib/supabase/server';

export interface AuthSession {
  user: {
    id: string;
    email: string | null;
  };
}

export const auth = {
  api: {
    async getSession(_input?: { headers?: Headers }): Promise<AuthSession | null> {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return { user: { id: data.user.id, email: data.user.email ?? null } };
    },
  },
};
