import { InStoreKioskClient } from '@/features/photobooth/components/InStoreKioskClient';

export function generateStaticParams() {
  return [
    { cafeSlug: 'demo' },
    { cafeSlug: 'stampy' },
    { cafeSlug: 'espresso-lab' },
    { cafeSlug: 'loyalty' },
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

interface KioskPageProps {
  params: Promise<{
    cafeSlug: string;
  }>;
}

export default async function PhotoboothKioskPage({ params }: KioskPageProps) {
  const resolved = await params;
  const cafeSlug = resolved?.cafeSlug || 'stampy';

  return <InStoreKioskClient cafeSlug={cafeSlug} />;
}
