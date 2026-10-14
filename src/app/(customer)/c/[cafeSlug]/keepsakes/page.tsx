import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KeepsakeArchiveClient } from '@/components/customer/KeepsakeArchiveClient';

export const metadata: Metadata = {
  title: 'أرشيف كروت الذكريات • stampy.',
  robots: { index: false, follow: false },
};

export default async function KeepsakeArchivePage({ params }: {
  params: Promise<{ cafeSlug: string }>;
}) {
  const { cafeSlug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(cafeSlug) ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  // The private list is fetched with the owner's session, including after a
  // venue closes. No service-role or customer data is sent from this page.
  return <KeepsakeArchiveClient cafeSlug={cafeSlug} />;
}
