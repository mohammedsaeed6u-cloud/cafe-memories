import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KeepsakeArchiveClient } from '@/components/customer/KeepsakeArchiveClient';

export const metadata: Metadata = {
  title: 'أرشيف كروت الذكريات • stampy.',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [
    { cafeSlug: 'demo' },
    { cafeSlug: 'stampy' },
    { cafeSlug: 'espresso-lab' },
  ];
}

export default async function KeepsakeArchivePage({ params }: {
  params: Promise<{ cafeSlug: string }>;
}) {
  const { cafeSlug } = await params;
  return <KeepsakeArchiveClient cafeSlug={cafeSlug || 'stampy'} />;
}
