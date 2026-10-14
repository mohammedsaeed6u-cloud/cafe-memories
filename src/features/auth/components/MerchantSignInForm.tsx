'use client';

import React from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GoogleIcon } from './GoogleIcon';

interface MerchantSignInFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOAuthLogin: (provider: 'google') => void;
}

export function MerchantSignInForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
  onOAuthLogin,
}: MerchantSignInFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 1. PRIMARY GOOGLE AUTHENTICATION */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onOAuthLogin('google')}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-lg transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 hover:scale-[1.01]"
        >
          <GoogleIcon className="w-5 h-5 shrink-0" />
          <span>تسجيل الدخول السريع عبر Google</span>
        </button>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#141212] px-3 text-[10px] uppercase font-bold text-[#A19E9B] font-mono">
            أو عبر البريد الإلكتروني وكلمة المرور
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>البريد الإلكتروني للتاجر:</span>
        </label>
        <input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@yourcafe.com"
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/40 focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>كلمة المرور:</span>
        </label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          dir="ltr"
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/40 focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#E8BF70] text-[#1B1B1E] disabled:opacity-50 text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(201,42,84,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-[1.01]"
      >
        <LogIn className="w-4 h-4" />
        <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
      </button>
    </form>
  );
}
