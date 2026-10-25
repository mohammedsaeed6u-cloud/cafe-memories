'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TicketButton } from '@/components/ui/TicketButton';
import { StampyApertureIcon } from '@/components/brand/StampyLogo';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : error.message
        );
        setLoading(false);
        return;
      }

      setSuccessMsg('تم تسجيل الدخول بنجاح! جاري التوجيه...');
      window.location.assign('/dashboard');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'تعذر تسجيل الدخول.');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stampy.pages.dev';
      const redirectTo = `${origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setErrorMsg('تسجيل الدخول عبر Google يتطلب تفعيل المزود من لوحة Supabase. يمكنك الدخول عبر البريد الإلكتروني.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر الاتصال بخدمة Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF5EB] text-[#3D2314] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative">
      {/* Background radial glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#E5A836]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-[#3D2314]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between relative z-10 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D2314]/70 hover:text-[#3D2314] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-[#3D2314] bg-white px-3 py-1 rounded-full border border-[#EADDC4] shadow-xs">
          STAMPY BUSINESS
        </span>
      </div>

      {/* Main Tabby-Style Clean White Card */}
      <div className="w-full max-w-md bg-white border-2 border-[#3D2314] rounded-2xl p-6 sm:p-8 shadow-stamp-hover relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center mx-auto mb-3">
            <StampyApertureIcon size={24} color="#3D2314" />
          </div>
          <h1 className="text-2xl font-black text-[#3D2314] tracking-tight">
            stampy.
          </h1>
          <p className="text-xs text-[#3D2314]/70 mt-1 font-semibold">
            تسجيل الدخول إلى لوحة تحكم المنشأة
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Fast Sign-in */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#FAF5EB] border-2 border-[#3D2314] text-[#3D2314] font-bold text-xs transition flex items-center justify-center gap-2.5 shadow-stamp-resting hover:shadow-stamp-hover cursor-pointer disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px]"
        >
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <span>المتابعة بحساب Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-[#EADDC4]" />
          <span className="absolute bg-white px-3 text-[11px] font-bold text-[#3D2314]/50">
            أو عبر البريد الإلكتروني
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="owner@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] placeholder-[#3D2314]/40 focus:border-[#B83A26] focus:bg-white focus:outline-none transition font-mono"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-[#3D2314]/40 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#3D2314]">
                كلمة المرور:
              </label>
              <span className="text-[11px] font-semibold text-[#B83A26] hover:underline cursor-pointer">
                نسيت كلمة المرور؟
              </span>
            </div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <TicketButton
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </TicketButton>
        </form>

        {/* Switch to Sign Up */}
        <div className="mt-5 pt-4 border-t border-[#EADDC4] text-center">
          <p className="text-xs text-[#3D2314]/70">
            ليس لديك حساب منشأة بعد؟{' '}
            <Link
              href="/signup"
              className="font-bold text-[#B83A26] hover:underline"
            >
              إنشاء حساب جديد (مجاناً)
            </Link>
          </p>
        </div>

        {/* Cashier Terminal Quick Link */}
        <div className="mt-3 text-center">
          <Link
            href="/terminal"
            className="text-[11px] font-bold text-[#527E78] hover:text-[#3D2314] transition inline-flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>دخول طاقم الخدمة والكاونتر عبر رمز PIN</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
