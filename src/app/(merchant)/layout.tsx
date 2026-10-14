import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await db
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!member) redirect("/login?setup=1");
  return (
    <div className="min-h-screen bg-paper text-ink font-sans">{children}</div>
  );
}
