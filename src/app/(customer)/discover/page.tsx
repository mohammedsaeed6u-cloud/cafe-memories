import type { Metadata } from 'next';
import { DiscoverClient } from '@/components/customer/DiscoverClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'stampy. — اكتشف أماكن الولاء القريبة',
  description:
    'دليل الأماكن التي تمنح أختامًا على كل زيارة: كافيهات، مطاعم، متاجر، وصالونات. امسح شريحة NFC وابدأ.',
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
