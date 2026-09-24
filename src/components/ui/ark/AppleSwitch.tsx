'use client';

import React from 'react';
import { Switch } from '@ark-ui/react';
import { cn } from '@/lib/utils';

export interface AppleSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (details: { checked: boolean }) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  name?: string;
}

export const AppleSwitch: React.FC<AppleSwitchProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
  description,
  className,
  name,
}) => {
  return (
    <Switch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      className={cn('inline-flex items-center justify-between gap-3 select-none apple-font cursor-pointer', className)}
    >
      {(label || description) && (
        <div className="flex flex-col text-right">
          {label && (
            <Switch.Label className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              {label}
            </Switch.Label>
          )}
          {description && (
            <span className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
              {description}
            </span>
          )}
        </div>
      )}
      <Switch.Control
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'bg-stone-300 dark:bg-stone-700 data-[state=checked]:bg-[#34C759]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759] focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        <Switch.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
          )}
        />
      </Switch.Control>
      <Switch.HiddenInput />
    </Switch.Root>
  );
};
