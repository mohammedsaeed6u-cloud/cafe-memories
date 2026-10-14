import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KeepsakePrintClient } from '@/components/customer/KeepsakePrintClient';

export const metadata: Metadata = {
  title: 'كارت ذكرياتك • Café Memories',
  robots: { index: false, follow: false },
};

export default async function KeepsakePage({ params }: {
  params: Promise<{ cafeSlug: string; cardId: string }>;
}) {
  const { cafeSlug, cardId } = await params;
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(cafeSlug) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardId) ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  // No private media in the HTML: the client fetches its own authenticated card.
  return <KeepsakePrintClient cafeSlug={cafeSlug} cardId={cardId} />;
}
