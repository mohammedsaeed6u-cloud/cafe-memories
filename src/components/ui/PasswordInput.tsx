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
          className="block text-xs font-bold text-[#3D2314] dark:text-[#FAF5EB] mb-1.5 cursor-pointer"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`w-full py-3 pr-4 pl-11 rounded-2xl bg-[#FAF5EB] dark:bg-[#3D2314] border border-[#EADDC4] dark:border-[#3D2314]/30] text-xs text-[#3D2314] dark:text-[#FAF5EB] placeholder-[#3D2314]/40 dark:placeholder-[#FAF5EB]/40 focus:outline-none focus:ring-2 focus:ring-[#B83A26] transition-all ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={showPassword ? 'إخفاء' : 'إظهار'}
          className="absolute left-3 p-1.5 rounded-lg text-[#3D2314]/60 dark:text-[#FAF5EB]/60 hover:text-[#3D2314] dark:hover:text-[#FAF5EB] transition cursor-pointer"
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
