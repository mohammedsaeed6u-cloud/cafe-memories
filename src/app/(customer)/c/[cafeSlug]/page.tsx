import { CustomerClient } from '@/components/customer/CustomerClient';

export function generateStaticParams() {
  return [
    { cafeSlug: 'memories' },
    { cafeSlug: 'studio' },
    { cafeSlug: 'flagship' },
    { cafeSlug: 'cafe' },
    { cafeSlug: 'specialty' },
    { cafeSlug: 'coffee' },
    { cafeSlug: 'roastery' },
    { cafeSlug: 'soil-roastery' },
    { cafeSlug: 'elan-cafe' },
    { cafeSlug: 'barns' },
    { cafeSlug: 'half-million' },
    { cafeSlug: 'arabica' },
    { cafeSlug: 'brew' },
    { cafeSlug: 'espresso' },
  ];
}

interface CustomerPageProps {
  params: Promise<{
    cafeSlug: string;
  }>;
}

export default async function CustomerPhotoboothPage({ params }: CustomerPageProps) {
  const resolved = await params;
  const cafeSlug = resolved?.cafeSlug || 'memories';

  return <CustomerClient cafeSlug={cafeSlug} />;
}
