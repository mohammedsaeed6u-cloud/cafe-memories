import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  clearOAuthIntent,
  merchantIntent,
  readOAuthIntent,
} from "@/lib/server/oauth-intent";

export async function GET(request: NextRequest) {
  const redirect = (path: string) =>
    clearOAuthIntent(
      NextResponse.redirect(new URL(path, request.url)),
      merchantIntent,
    );
  const code = request.nextUrl.searchParams.get("code");
  const flow = request.nextUrl.searchParams.get("flow");
  const googleIntent =
    flow === "google"
      ? readOAuthIntent(
          request,
          merchantIntent,
          request.nextUrl.searchParams.get("nonce"),
        )
      : null;
  if (!code) return redirect("/login?error=missing-code");
  // Never exchange a customer OAuth code just because the Supabase redirect
  // allowlist fell back to this route. Email confirmations declare their flow.
  if (flow !== "email" && (flow !== "google" || googleIntent === null)) {
    return redirect("/login?error=wrong-flow");
  }
  try {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user || user.is_anonymous)
      throw new Error("Verified merchant session missing");

    if (flow === "google") {
      // New Google accounts choose their own business name/slug after OAuth.
      // A Google profile name is a person's name, not a legitimate venue name.
      const { data: member, error: lookupError } = await db
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (lookupError) throw lookupError;
      return redirect(member ? "/dashboard" : "/onboarding");
    }

    const metadataName = user.user_metadata?.cafe_name;
    const metadataSlug = user.user_metadata?.cafe_slug;
    const fromMerchantSignup =
      typeof metadataName === "string" &&
      metadataName.trim().length >= 2 &&
      typeof metadataSlug === "string" &&
      /^[a-z0-9][a-z0-9-]{2,39}$/.test(metadataSlug);
    // Email confirmations can arrive on another device (no intent cookie),
    // but still require a merchant signup with valid business metadata.
    if (!fromMerchantSignup) return redirect("/login?error=wrong-flow");
    // Confirmed email establishes identity only. The owner chooses/uploads a
    // real brand logo on /onboarding before provisioning the organization.
    const { data: member, error: lookupError } = await db.from("organization_members")
      .select("id").eq("user_id", user.id).limit(1).maybeSingle();
    if (lookupError) throw lookupError;
    return redirect(member ? "/dashboard" : "/onboarding");
  } catch (error) {
    console.error("Merchant auth callback failed:", error);
    return redirect("/login?error=setup-failed");
  }
}
