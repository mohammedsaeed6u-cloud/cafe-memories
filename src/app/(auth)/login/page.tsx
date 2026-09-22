'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Shield,
  AlertCircle,
  KeyRound,
  Mail,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Store,
  ChevronLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { STAFF_ROSTER } from '@/types/staff';
import { verifyStaffPin, setActiveStaffMember } from '@/lib/services/staff-auth.service';

type AuthMode = 'merchant' | 'pin';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('merchant');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email / Password state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Staff PIN state
  const [selectedStaffId, setSelectedStaffId] = useState<string>(STAFF_ROSTER[0]?.id || 'staff-1');
  const [pin, setPin] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.location.href = '/dashboard';
        }
      });
    } catch {}
  }, []);

  // --- Real Supabase Email / Password Handler ---
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

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          setSuccessMsg('تم إنشاء الحساب بنجاح! جاري تحويلك إلى لوحة التحكم...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 600);
        } else {
          setSuccessMsg(
            'تم إرسال رابط التأكيد لبريدك الإلكتروني، أو يمكنك الدخول فوراً عبر زر التجربة السريعة أدناه.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(
            error.message === 'Invalid login credentials'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
              : error.message
          );
          return;
        }

        if (data.session) {
          setSuccessMsg('تم تسجيل الدخول بنجاح! جاري الانتقال...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء المصادقة.');
    } finally {
      setLoading(false);
    }
  };

  // --- Real Staff / Barista PIN Authentication ---
  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setErrorMsg('يرجى إدخال رمز الصالة المكون من 4 أرقام.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await verifyStaffPin(selectedStaffId, pin);

      if (!result.success) {
        setErrorMsg(result.error || 'الرمز السري غير صحيح.');
        return;
      }

      setSuccessMsg(`أهلاً بك، ${result.staff?.name}! جاري الدخول للوحة التحكم...`);
      try {
        document.cookie = 'memories_staff_session=1; path=/; max-age=86400; SameSite=Lax';
      } catch {}
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر التحقق من الرمز.');
    } finally {
      setLoading(false);
    }
  };

  // --- Real Google OAuth ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    const redirectUrl = `${window.location.origin}/auth/callback`;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMsg(`Google OAuth: ${error.message}`);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg('تعذر بدء جلسة Google OAuth. يرجى تجربة الدخول المباشر.');
    } finally {
      setLoading(false);
    }
  };

  // --- 1-Click Instant Demo Merchant Access ---
  const handleDemoMerchantAccess = () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg('جاري تحضير جلسة التاجر التجريبية والدخول للوحة التحكم...');

    // Set active manager staff in roster
    const manager = STAFF_ROSTER.find((s) => s.role === 'manager') || STAFF_ROSTER[0];
    if (manager) {
      setActiveStaffMember(manager.id);
    }

    try {
      document.cookie = 'memories_staff_session=1; path=/; max-age=86400; SameSite=Lax';
    } catch {}

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-xl text-stone-900 font-cairo">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black mx-auto shadow-md text-base">
          M
        </div>
        <h1 className="text-2xl font-black text-stone-950 tracking-tight">
          بوابة الكافيهات والمتاجر
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
          سجّل دخولك لإدارة كروت الولاء، محطة الطباعة، شاشات الصالة الحية، واعتماد الذكريات.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 border border-stone-200/80 mb-6">
        <button
          type="button"
          onClick={() => {
            setAuthMode('merchant');
            setErrorMsg(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            authMode === 'merchant'
              ? 'bg-stone-950 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-950'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>حساب التاجر (Owner)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode('pin');
            setErrorMsg(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            authMode === 'pin'
              ? 'bg-stone-950 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-950'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>رمز الباريستا (Staff PIN)</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-right">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-right">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* TAB 1: Merchant Account (Google OAuth + Email + 1-Click Demo) */}
      {authMode === 'merchant' && (
        <div className="space-y-4">
          {/* Fast Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-900 font-bold text-xs border border-stone-300 flex items-center justify-center gap-2.5 shadow-2xs transition-all hover:border-stone-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>الدخول السريع بحساب Google</span>
          </button>

          {/* 1-Click Instant Demo Access */}
          <button
            type="button"
            onClick={handleDemoMerchantAccess}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>دخول تجريبي فوري لمالك الكافيه (1-Click Demo)</span>
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white px-3 text-stone-400 font-bold">أو بالبريد الإلكتروني</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5 text-right">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                البريد الإلكتروني:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@cafe.com"
                required
                className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-right transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                كلمة المرور:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-right transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'جاري التحقق...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول بالبريد'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-stone-500 hover:text-stone-900 underline cursor-pointer"
              >
                {isSignUp ? 'لديك حساب بالفعل؟ سجّل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Staff / Barista PIN Flow */}
      {authMode === 'pin' && (
        <form onSubmit={handlePinAuth} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              اختر الموظف أو الدور:
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right cursor-pointer"
            >
              {STAFF_ROSTER.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.role === 'manager' ? 'مدير الفرع' : 'باريستا رئيسي'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              رمز الدخول السري (4 أرقام):
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-stone-50 border border-stone-300 text-center text-2xl tracking-[0.5em] font-mono text-stone-950 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Quick preset PIN buttons for instant testing */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-stone-400 font-bold">رموز تجريبية:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedStaffId('staff-4');
                setPin('4567');
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 transition"
            >
              المدير (4567)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStaffId('staff-1');
                setPin('1234');
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 transition"
            >
              الباريستا (1234)
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>{loading ? 'جاري التحقق...' : 'تأكيد الرمز ودخول الصالة'}</span>
          </button>
        </form>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-5 border-t border-stone-200 text-center space-y-2">
        <Link
          href="/"
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center gap-1 font-bold"
        >
          <span>العودة للصفحة الرئيسية</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
        <p className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>منظومة مؤمنة وفق أعلى معايير أمان البيانات وصلاحيات الصالة</span>
        </p>
      </div>
    </div>
  );
}
