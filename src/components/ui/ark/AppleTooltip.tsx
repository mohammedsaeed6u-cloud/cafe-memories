'use client';

import React from 'react';
import { Tooltip } from '@ark-ui/react';
import { cn } from '@/lib/utils';

export interface AppleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  className?: string;
}

export const AppleTooltip: React.FC<AppleTooltipProps> = ({
  content,
  children,
  openDelay = 300,
  closeDelay = 150,
  className,
}) => {
  return (
    <Tooltip.Root openDelay={openDelay} closeDelay={closeDelay}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content
          className={cn(
            'z-50 px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-tight text-white',
            'bg-[#1C1C1E]/90 dark:bg-[#2C2C2E]/90 backdrop-blur-md border border-white/10 shadow-lg',
            'animate-in fade-in zoom-in-95 duration-150 apple-font select-none',
            className
          )}
        >
          <Tooltip.Arrow>
            <Tooltip.ArrowTip className="border-t border-l border-white/10 bg-[#1C1C1E]/90" />
          </Tooltip.Arrow>
          {content}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};
