import { notFound } from 'next/navigation';
import { CustomerClient } from '@/components/customer/CustomerClient';
import { resolveVenue } from '@/lib/server/context';

export default async function CustomerPage({ params, searchParams }: {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ branch?: string; auth_error?: string }>;
}) {
  const { cafeSlug } = await params;
  const { branch: requestedBranch, auth_error: authError } = await searchParams;
  const branch = requestedBranch || undefined;
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(cafeSlug) ||
      (branch && !/^[a-z0-9][a-z0-9-]{0,59}$/.test(branch)) ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  let venue;
  try { venue = await resolveVenue(cafeSlug, branch); } catch { notFound(); }
  if (!venue) notFound();
  return <CustomerClient cafeSlug={cafeSlug} branchSlug={branch} authError={authError} />;
}
