'use client';

import React from 'react';
import { Store, Mail, Lock, Sparkles } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GoogleIcon } from './GoogleIcon';

interface MerchantSignUpFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  cafeName: string;
  onCafeNameChange: (val: string) => void;
  cafeSlug: string;
  setCafeSlug: (val: string) => void;
  setIsSlugManuallyEdited: (val: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOAuthLogin?: (provider: 'google') => void;
}

export function MerchantSignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  cafeName,
  onCafeNameChange,
  cafeSlug,
  setCafeSlug,
  setIsSlugManuallyEdited,
  loading,
  onSubmit,
  onOAuthLogin,
}: MerchantSignUpFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 1. PRIMARY GOOGLE AUTHENTICATION */}
      {onOAuthLogin && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onOAuthLogin('google')}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-lg transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 hover:scale-[1.01]"
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>إنشاء الحساب بضغطة واحدة عبر Google</span>
          </button>
          <p className="text-[11px] text-[#A19E9B] text-center leading-relaxed font-sans">
            ⚡ سيتم استيراد اسمك، بريدك، وصورتك تلقائياً لتهيئة مساحة عملك فوراً.
          </p>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#141212] px-3 text-[10px] uppercase font-bold text-[#A19E9B] font-mono">
              أو التسجيل اليدوي بالبريد
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>اسم المنشأة أو العلامة التجارية:</span>
        </label>
        <input
          type="text"
          required
          value={cafeName}
          onChange={(e) => onCafeNameChange(e.target.value)}
          placeholder="مثال: مقهى ومحمصة الأثر، بوتيك صويل..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/40 focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-[#DFAB56] font-mono text-xs">@</span>
            <span>رابط المتجر المخصص (Workspace Slug)</span>
          </span>
          <span className="text-[10px] text-[#A19E9B] font-mono">stampy.app/c/{cafeSlug || 'your-cafe'}</span>
        </label>
        <input
          type="text"
          dir="ltr"
          required
          value={cafeSlug}
          onChange={(e) => {
            setIsSlugManuallyEdited(true);
            setCafeSlug(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 30)
            );
          }}
          placeholder="your-cafe"
          className="w-full px-3.5 py-2 rounded-lg bg-[#0B0A0A] border border-white/10 text-xs font-mono font-bold text-[#FBF9F5] placeholder:text-[#A19E9B]/40 focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition"
        />
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
          <span>كلمة المرور (6 خانات على الأقل):</span>
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
        <Sparkles className="w-4 h-4" />
        <span>{loading ? 'جاري تجهيز مساحة العمل...' : 'إنشاء الحساب وبدء الاستخدام فوراً 🚀'}</span>
      </button>
    </form>
  );
}
