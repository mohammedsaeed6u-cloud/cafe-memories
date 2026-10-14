import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MerchantOnboardingClient } from "@/components/auth/MerchantOnboardingClient";

/** Google sign-in establishes the identity; only a verified user may name a new venue. */
export default async function MerchantOnboardingPage() {
  const db = await createClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user || user.is_anonymous) redirect("/login");
  const { data: member, error } = await db
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (member) redirect("/dashboard");
  const initialName = typeof user.user_metadata?.cafe_name === 'string'
    ? user.user_metadata.cafe_name.trim().slice(0, 100) : '';
  const initialSlug = typeof user.user_metadata?.cafe_slug === 'string' &&
    /^[a-z0-9][a-z0-9-]{2,39}$/.test(user.user_metadata.cafe_slug)
    ? user.user_metadata.cafe_slug : '';
  return <MerchantOnboardingClient email={user.email ?? null}
    initialName={initialName} initialSlug={initialSlug} />;
}
