import type { Metadata } from 'next';
import { CardsClient } from '@/components/customer/CardsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'stampy. — بطاقاتي',
  description: 'كل بطاقات الولاء التي جمعتها من الأماكن القريبة، في مكان واحد.',
};

export default function CardsPage() {
  return <CardsClient />;
}
