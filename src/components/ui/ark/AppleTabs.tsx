'use client';

import React from 'react';
import { Tabs } from '@ark-ui/react';
import { cn } from '@/lib/utils';

export interface AppleTabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (details: { value: string }) => void;
  children: React.ReactNode;
  className?: string;
}

export const AppleTabs: React.FC<AppleTabsProps> = ({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}) => {
  return (
    <Tabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={cn('w-full apple-font', className)}
    >
      {children}
    </Tabs.Root>
  );
};

export const AppleTabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <Tabs.List
      className={cn(
        'relative flex items-center gap-1 p-1 rounded-xl bg-black/[0.06] dark:bg-white/[0.1] backdrop-blur-md border border-black/[0.04] dark:border-white/[0.08]',
        className
      )}
    >
      {children}
    </Tabs.List>
  );
};

export const AppleTabTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ value, children, className, disabled }) => {
  return (
    <Tabs.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300',
        'transition-all duration-200 select-none cursor-pointer',
        'data-[selected]:bg-white data-[selected]:text-stone-900 data-[selected]:shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
        'dark:data-[selected]:bg-[#636366] dark:data-[selected]:text-white',
        'active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </Tabs.Trigger>
  );
};

export const AppleTabContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  return (
    <Tabs.Content
      value={value}
      className={cn('mt-3 animate-in fade-in duration-200 focus:outline-none', className)}
    >
      {children}
    </Tabs.Content>
  );
};
