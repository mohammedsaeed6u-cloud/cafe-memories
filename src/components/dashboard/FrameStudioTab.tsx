'use client';

import React from 'react';
import { FrameStudioTabProps, useFrameStudio, FrameStudioContent } from '@/features/frame-studio';

export type { FrameStudioTabProps };

export const FrameStudioTab: React.FC<FrameStudioTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const studio = useFrameStudio(settings, onSettingsUpdated);

  return <FrameStudioContent studio={studio} />;
};
