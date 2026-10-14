import { notFound } from 'next/navigation';
import { z } from 'zod';
import { WallClient } from '@/components/wall/WallClient';

export default async function WallPage({ params }: { params: Promise<{ screenId: string }> }) {
  const { screenId } = await params;
  if (!z.uuid().safeParse(screenId).success) notFound();
  return <WallClient screenId={screenId} />;
}
