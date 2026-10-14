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
      primary: 'bg-[#B85C43] text-white hover:bg-[#A04F38] active:bg-[#8D442E] shadow-sm focus-visible:ring-[#B85C43]',
      secondary: 'bg-[#1E3A32] text-white hover:bg-[#162B25] active:bg-[#0F1E19] shadow-sm focus-visible:ring-[#1E3A32]',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
      outline: 'border border-[#E8DCC6] bg-transparent text-[#3B2F2A] hover:bg-[#FAF6EE] dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:ring-stone-400',
      ghost: 'bg-transparent text-[#3B2F2A] hover:bg-[#FAF6EE] dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:ring-stone-400',
      link: 'text-[#B85C43] underline-offset-4 hover:underline p-0 h-auto font-medium focus-visible:ring-offset-0',
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
