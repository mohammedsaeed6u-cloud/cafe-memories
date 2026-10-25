import { WallClient } from '@/components/wall/WallClient';

export const dynamic = 'force-dynamic';

interface WallPageProps {
  params: Promise<{ screenId: string }>;
}

export default async function WallPage({ params }: WallPageProps) {
  const resolved = await params;
  return <WallClient screenId={resolved?.screenId} />;
}
