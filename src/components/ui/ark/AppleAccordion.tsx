'use client';

import React from 'react';
import { Accordion } from '@ark-ui/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppleAccordionProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (details: { value: string[] }) => void;
  multiple?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AppleAccordion: React.FC<AppleAccordionProps> = ({
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  collapsible = true,
  children,
  className,
}) => {
  return (
    <Accordion.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      multiple={multiple}
      collapsible={collapsible}
      className={cn('w-full space-y-2.5 apple-font', className)}
    >
      {children}
    </Accordion.Root>
  );
};

export const AppleAccordionItem: React.FC<{
  value: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}> = ({ value, title, children, className, icon }) => {
  return (
    <Accordion.Item
      value={value}
      className={cn(
        'group rounded-2xl border border-black/[0.06] dark:border-white/[0.08]',
        'bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md overflow-hidden transition-all duration-200',
        'data-[state=open]:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] data-[state=open]:border-black/[0.12] dark:data-[state=open]:border-white/[0.16]',
        className
      )}
    >
      <Accordion.ItemTrigger className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-right cursor-pointer select-none">
        <div className="flex items-center gap-3">
          {icon && <span className="text-stone-500 dark:text-stone-400 shrink-0">{icon}</span>}
          <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-[#FAF6EE] group-hover:text-[#0071E3] transition-colors">
            {title}
          </span>
        </div>
        <Accordion.ItemIndicator className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-stone-400 transition-transform duration-200 group-data-[state=open]:rotate-180">
          <ChevronDown className="w-4 h-4" />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed animate-in fade-in duration-200">
        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          {children}
        </div>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
};
