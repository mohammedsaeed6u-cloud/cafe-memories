'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function PasswordInput({
  label,
  error,
  className = '',
  id,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || 'password-input-' + Math.random().toString(36).substring(2, 7);

  return (
    <div className="w-full font-cairo text-right">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#3B2F2A] dark:text-[#FAF6EE] mb-1.5 cursor-pointer"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`w-full py-3 pr-4 pl-11 rounded-2xl bg-[#FAF6EE] dark:bg-[#1E3A32] border border-[#E8DCC6] dark:border-[#2A4F44] text-xs text-[#3B2F2A] dark:text-[#FAF6EE] placeholder-[#3B2F2A]/40 dark:placeholder-[#FAF6EE]/40 focus:outline-none focus:ring-2 focus:ring-[#B85C43] transition-all ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={showPassword ? 'إخفاء' : 'إظهار'}
          className="absolute left-3 p-1.5 rounded-lg text-[#3B2F2A]/60 dark:text-[#FAF6EE]/60 hover:text-[#1E3A32] dark:hover:text-[#FAF6EE] transition cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-bold mt-1 pr-1">{error}</p>
      )}
    </div>
  );
}
