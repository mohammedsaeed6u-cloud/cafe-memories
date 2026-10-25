import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TapClient } from '@/components/customer/TapClient';
import { READER_PUBLIC_ID_PATTERN } from '@/lib/nfc-tag';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'stampy. — نقرة واحدة، ختم جديد',
  description: 'قرّب هاتفك من شريحة NFC لتسجيل زيارتك وفتح كارت الأختام.',
  robots: { index: false, follow: false },
};

interface TapPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function TapPage({ params }: TapPageProps) {
  const { publicId } = await params;
  if (!READER_PUBLIC_ID_PATTERN.test(publicId)) notFound();
  return <TapClient publicId={publicId} />;
}
