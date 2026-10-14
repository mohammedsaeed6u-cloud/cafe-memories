'use client';

import React from 'react';
import { UseFrameStudioReturn } from '../types';
import { FrameStudioQuickIdentityBar } from './FrameStudioQuickIdentityBar';
import { FrameStudioIndustrySelector } from './FrameStudioIndustrySelector';
import { FrameStudioBrandingSection } from './FrameStudioBrandingSection';
import { FrameStudioThemesSection } from './FrameStudioThemesSection';
import { FrameStudioDimensionsSection } from './FrameStudioDimensionsSection';
import { FrameStudioBorderRadiusSection } from './FrameStudioBorderRadiusSection';
import { FrameStudioColorSection } from './FrameStudioColorSection';
import { FrameStudioRewardAndCornersSection } from './FrameStudioRewardAndCornersSection';
import { FrameStudioSaveButton } from './FrameStudioSaveButton';
import { FrameStudioLivePreview } from './FrameStudioLivePreview';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioContent: React.FC<Props> = ({ studio }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Controls (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <FrameStudioQuickIdentityBar studio={studio} />
        <FrameStudioIndustrySelector studio={studio} />
        <FrameStudioBrandingSection studio={studio} />
        <FrameStudioThemesSection studio={studio} />
        <FrameStudioDimensionsSection studio={studio} />
        <FrameStudioBorderRadiusSection studio={studio} />
        <FrameStudioColorSection studio={studio} />
        <FrameStudioRewardAndCornersSection studio={studio} />
        <FrameStudioSaveButton studio={studio} />
      </div>

      {/* Right Column: Live Interactive Card Preview (5 cols) */}
      <FrameStudioLivePreview studio={studio} />
    </div>
  );
};
