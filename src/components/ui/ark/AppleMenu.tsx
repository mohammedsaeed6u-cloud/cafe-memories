'use client';

import React from 'react';
import { Menu } from '@ark-ui/react';
import { cn } from '@/lib/utils';

export interface AppleMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AppleMenu: React.FC<AppleMenuProps> = ({ trigger, children, className }) => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content
          className={cn(
            'z-50 min-w-[180px] p-1.5 rounded-2xl border border-black/10 dark:border-white/10',
            'bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl shadow-[0_16px_36px_-6px_rgba(0,0,0,0.25)]',
            'text-stone-900 dark:text-white apple-font animate-in fade-in zoom-in-95 duration-150 focus:outline-none',
            className
          )}
        >
          {children}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export const AppleMenuItem: React.FC<{
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
  onSelect?: () => void;
  className?: string;
}> = ({ value, children, icon, destructive, onSelect, className }) => {
  return (
    <Menu.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-colors',
        destructive
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
          : 'text-stone-800 dark:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white',
        'data-[highlighted]:bg-[#0071E3] data-[highlighted]:text-white',
        className
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </Menu.Item>
  );
};

export const AppleMenuSeparator: React.FC = () => (
  <Menu.Separator className="h-px my-1 bg-black/5 dark:bg-white/10" />
);
