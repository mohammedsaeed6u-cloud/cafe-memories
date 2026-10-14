import { notFound } from 'next/navigation';
import { CustomerClient } from '@/components/customer/CustomerClient';
import { resolveVenue } from '@/lib/server/context';

export default async function CustomerPage({ params, searchParams }: {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { cafeSlug } = await params;
  const { branch } = await searchParams;
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(cafeSlug) ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  let venue;
  try { venue = await resolveVenue(cafeSlug, branch); } catch { notFound(); }
  if (!venue) notFound();
  return <CustomerClient cafeSlug={cafeSlug} branchSlug={branch} />;
}
