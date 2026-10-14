import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') notFound();
  return <div className="min-h-screen bg-[#141313] text-[#e6e1e1]">{children}</div>;
}
