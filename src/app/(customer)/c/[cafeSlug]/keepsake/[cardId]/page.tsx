import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KeepsakePrintClient } from '@/components/customer/KeepsakePrintClient';

export const metadata: Metadata = {
  title: 'كارت ذكرياتك • stampy.',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [
    { cafeSlug: 'demo', cardId: '00000000-0000-0000-0000-000000000000' },
    { cafeSlug: 'stampy', cardId: '00000000-0000-0000-0000-000000000000' },
    { cafeSlug: 'espresso-lab', cardId: '00000000-0000-0000-0000-000000000000' },
  ];
}

export default async function KeepsakePage({ params }: {
  params: Promise<{ cafeSlug: string; cardId: string }>;
}) {
  const { cafeSlug, cardId } = await params;
  // No private media in the HTML: the client fetches its own authenticated card.
  return <KeepsakePrintClient cafeSlug={cafeSlug || 'stampy'} cardId={cardId || '00000000-0000-0000-0000-000000000000'} />;
}
