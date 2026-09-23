import { CustomerClient } from '@/components/customer/CustomerClient';

export function generateStaticParams() {
  return [
    { cafeSlug: 'espresso-lab' },
    { cafeSlug: 'artisan-roastery' },
    { cafeSlug: 'roastery-house' },
    { cafeSlug: 'cova-milano' },
    { cafeSlug: 'memories-flagship' },
    { cafeSlug: 'memories' },
    { cafeSlug: 'specialty-coffee' },
  ];
}

interface CustomerPageProps {
  params: Promise<{
    cafeSlug: string;
  }>;
}

export default async function CustomerPhotoboothPage({ params }: CustomerPageProps) {
  const resolved = await params;
  const cafeSlug = resolved?.cafeSlug || 'espresso-lab';

  return <CustomerClient cafeSlug={cafeSlug} />;
}
