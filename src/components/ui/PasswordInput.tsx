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
    <div className="w-full font-sans text-right">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#3D2314] mb-1.5 cursor-pointer"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`w-full py-3 pr-4 pl-11 rounded-xl bg-white border border-[#EADDC4] text-xs text-[#3D2314] placeholder-[#A19E9B] focus:outline-none focus:border-[#DFAB56] focus:ring-2 focus:ring-[#DFAB56]/20 transition-all font-mono ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={showPassword ? 'إخفاء' : 'إظهار'}
          className="absolute left-3 p-1.5 rounded-lg text-[#63574D] hover:text-[#3D2314] transition cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-rose-600 font-medium mt-1 pr-1">{error}</p>
      )}
    </div>
  );
}
