'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-[#B83A26] text-white hover:bg-[#A0301F] active:bg-[#852315] shadow-sm focus-visible:ring-[#B83A26]',
      secondary: 'bg-[#3D2314] text-white hover:bg-[#2A180E] active:bg-[#1F110A] shadow-sm focus-visible:ring-[#3D2314]',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
      outline: 'border border-[#EADDC4] bg-transparent text-[#3D2314] hover:bg-[#FAF5EB] dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:ring-[#DFAB56]',
      ghost: 'bg-transparent text-[#3D2314] hover:bg-[#FAF5EB] dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:ring-[#DFAB56]',
      link: 'text-[#B83A26] underline-offset-4 hover:underline p-0 h-auto font-medium focus-visible:ring-offset-0',
    }[variant];

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
      md: 'h-10 px-4 text-sm gap-2 rounded-xl',
      lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
      icon: 'h-10 w-10 p-0 rounded-xl justify-center',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
