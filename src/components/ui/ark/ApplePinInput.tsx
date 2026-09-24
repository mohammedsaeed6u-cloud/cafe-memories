'use client';

import React from 'react';
import { PinInput } from '@ark-ui/react';
import { cn } from '@/lib/utils';

export interface ApplePinInputProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (details: { value: string[]; valueAsString: string }) => void;
  onValueComplete?: (details: { value: string[]; valueAsString: string }) => void;
  disabled?: boolean;
  length?: number;
  mask?: boolean;
  label?: string;
  className?: string;
  hasError?: boolean;
}

export const ApplePinInput: React.FC<ApplePinInputProps> = ({
  value,
  defaultValue,
  onValueChange,
  onValueComplete,
  disabled,
  length = 4,
  mask = true,
  label,
  className,
  hasError = false,
}) => {
  return (
    <PinInput.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onValueComplete={onValueComplete}
      disabled={disabled}
      mask={mask}
      otp
      type="numeric"
      className={cn('flex flex-col items-center gap-3 apple-font', className)}
    >
      {label && (
        <PinInput.Label className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          {label}
        </PinInput.Label>
      )}
      <PinInput.Control className="flex items-center gap-3">
        {Array.from({ length }).map((_, index) => (
          <PinInput.Input
            key={index}
            index={index}
            className={cn(
              'w-12 h-14 text-center text-xl font-bold rounded-2xl border transition-all duration-150',
              'bg-white/90 dark:bg-[#2C2C2E] backdrop-blur-sm',
              hasError
                ? 'border-red-500 text-red-600 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'
                : 'border-black/10 dark:border-white/10 text-stone-900 dark:text-white focus:border-[#0071E3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.2)]',
              'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          />
        ))}
      </PinInput.Control>
      <PinInput.HiddenInput />
    </PinInput.Root>
  );
};
