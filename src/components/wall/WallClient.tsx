'use client';

import React from 'react';
import { WallClientProps, useLiveWall, WallContent } from '@/features/live-wall';

export type { WallClientProps };

export function WallClient({ screenId }: WallClientProps) {
  const wall = useLiveWall(screenId);

  return <WallContent wall={wall} />;
}
