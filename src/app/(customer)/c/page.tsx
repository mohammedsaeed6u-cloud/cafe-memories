import { redirect } from 'next/navigation';

/** Old QR links without a tenant cannot safely resolve to a default merchant. */
export default async function LegacyCustomerPage({ searchParams }: {
  searchParams: Promise<{ cafe?: string; branch?: string }>;
}) {
  const { cafe, branch } = await searchParams;
  if (!cafe || !/^[a-z0-9-]{3,40}$/.test(cafe)) redirect('/');
  redirect(`/c/${encodeURIComponent(cafe)}${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`);
}
