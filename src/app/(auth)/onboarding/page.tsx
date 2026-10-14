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
  return <MerchantOnboardingClient email={user.email ?? null} />;
}
