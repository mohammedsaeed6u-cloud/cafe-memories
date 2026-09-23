import { WallClient } from '@/components/wall/WallClient';

export function generateStaticParams() {
  return [
    { screenId: 'screen-1' },
    { screenId: 'screen-101' }
  ];
}

interface WallPageProps {
  params: Promise<{
    screenId: string;
  }>;
}

export default async function WallPage({ params }: WallPageProps) {
  const resolved = await params;
  const screenId = resolved?.screenId || 'screen-1';

  return <WallClient screenId={screenId} />;
}
