'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  AlertCircle,
  KeyRound,
  Mail,
  CheckCircle2,
  Lock,
  ArrowRight,
  Store,
  ChevronLeft,
  UserPlus,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { STAFF_ROSTER } from '@/types/staff';
import { verifyPinOnly } from '@/lib/services/staff-auth.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { StampyLogo, StampyApertureIcon } from '@/components/brand/StampyLogo';

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

type AuthMode = 'signin' | 'signup' | 'pin';

export default function LoginPage({ initialMode = 'signin' }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [cafeSlug, setCafeSlug] = useState('');
  const [pin, setPin] = useState('');
  const [hostDomain, setHostDomain] = useState('memories-d9l.pages.dev');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setHostDomain(window.location.host);
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'signup' || tab === 'signin' || tab === 'pin') {
          setMode(tab);
        }
      }
    } catch {}
  }, []);

  // Update slug automatically when store name changes
  const handleNameChange = (val: string) => {
    setCafeName(val);
    const clean = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setCafeSlug(clean || '');
  };

  // Email / Password Form Submit
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
      if (mode === 'signup') {
        if (!cafeName.trim()) {
          setErrorMsg('يرجى إدخال اسم المنشأة أو العلامة التجارية.');
          setLoading(false);
          return;
        }

        const rawName = cafeName.trim();
        let slug = cafeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) {
          slug = rawName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 40) || `brand-${Math.floor(100 + Math.random() * 900)}`;
        }

        // Persist merchant session
        localStorage.setItem('memories_active_merchant_slug', slug);
        localStorage.setItem('memories_active_merchant_name', rawName);
        localStorage.setItem('memories_active_merchant_email', email);

        try {
          const regStr = localStorage.getItem('memories_registered_merchants');
          const registeredList = JSON.parse(regStr || '[]');
          const existingIndex = registeredList.findIndex((m: any) => m.email?.toLowerCase() === email.toLowerCase());
          const newEntry = { email, name: rawName, slug, password };
          if (existingIndex >= 0) {
            registeredList[existingIndex] = newEntry;
          } else {
            registeredList.push(newEntry);
          }
          localStorage.setItem('memories_registered_merchants', JSON.stringify(registeredList));
        } catch {}

        // Initialize business settings
        const existingSettings = BusinessSettingsService.getSettings(slug);
        BusinessSettingsService.saveSettings({
          ...existingSettings,
          cafeSlug: slug,
          cafeName: rawName,
          branding: {
            ...existingSettings.branding,
            name: rawName,
            tagline: 'تجربة ضيافة مميزة وذكريات تدوم',
            instagramHandle: `@${slug.replace(/[^a-z0-9_]/gi, '')}`,
          },
        });

        try {
          localStorage.setItem(`memories_crm_customers_${slug}`, JSON.stringify([]));
          localStorage.setItem(`memories_print_queue_${slug}`, JSON.stringify([]));
          localStorage.setItem(`memories_wall_photos_${slug}`, JSON.stringify([]));
        } catch {}

        document.cookie = 'memories_staff_session=1; path=/; max-age=604800; SameSite=Lax';

        try {
          const supabase = createClient();
          await supabase.auth.signUp({
            email,
            password,
            options: { data: { cafe_name: rawName, cafe_slug: slug } },
          });
        } catch {}

        setSuccessMsg(`تم إنشاء حساب "${rawName}" بنجاح! جاري الانتقال للوحة التحكم...`);
        setTimeout(() => {
          window.location.href = `/dashboard?cafe=${slug}&launch=1`;
        }, 600);
      } else {
        // Sign In
        let signedInName = '';
        let signedInSlug = '';

        try {
          const regStr = localStorage.getItem('memories_registered_merchants');
          const registeredList = JSON.parse(regStr || '[]');
          const matched = registeredList.find((m: any) => m.email?.toLowerCase() === email.toLowerCase());
          if (matched) {
            signedInName = matched.name;
            signedInSlug = matched.slug;
          }
        } catch {}

        if (!signedInName) {
          try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.session) {
              signedInName = data.user?.user_metadata?.cafe_name || '';
              signedInSlug = data.user?.user_metadata?.cafe_slug || '';
            }
          } catch {}
        }

        if (!signedInName) {
          const currentStoredEmail = localStorage.getItem('memories_active_merchant_email');
          if (currentStoredEmail && currentStoredEmail.toLowerCase() === email.toLowerCase()) {
            signedInName = localStorage.getItem('memories_active_merchant_name') || '';
            signedInSlug = localStorage.getItem('memories_active_merchant_slug') || '';
          }
        }

        if (!signedInName) {
          setErrorMsg('هذا البريد غير مسجل بعد. يمكنك إنشاء حساب جديد مجاناً.');
          setMode('signup');
          setLoading(false);
          return;
        }

        document.cookie = 'memories_staff_session=1; path=/; max-age=604800; SameSite=Lax';
        localStorage.setItem('memories_active_merchant_slug', signedInSlug);
        localStorage.setItem('memories_active_merchant_name', signedInName);
        localStorage.setItem('memories_active_merchant_email', email);

        setSuccessMsg(`أهلاً بعودتك! جاري فتح لوحة التحكم (${signedInName})...`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  // Staff PIN Auth
  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setErrorMsg('يرجى إدخال رمز الموظف المكون من 4 أرقام.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await verifyPinOnly(pin);
      if (!result.success) {
        setErrorMsg(result.error || 'الرمز السري غير صحيح.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`أهلاً بك، ${result.staff?.name || 'الموظف'}! جاري الدخول للوحة التحكم...`);
      document.cookie = 'memories_staff_session=1; path=/; max-age=86400; SameSite=Lax';
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر التحقق من الرمز.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://memories-d9l.pages.dev';
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
        if (error.message.includes('Unsupported provider') || error.message.includes('not enabled')) {
          setErrorMsg('تسجيل الدخول عبر Google يتطلب تفعيل المزود من لوحة Supabase. يمكنك الدخول عبر البريد الإلكتروني أدناه.');
        } else {
          setErrorMsg(error.message);
        }
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
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#DFAB56]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-[#3D2314]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between relative z-10 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#63574D] hover:text-[#3D2314] transition"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>العودة للرئيسية</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-[#63574D] bg-white/80 px-2.5 py-1 rounded-md border border-[#EADDC4]">
          STAMPY BUSINESS
        </span>
      </div>

      {/* Main Tabby-Style Clean White Card */}
      <div className="w-full max-w-md bg-white border border-[#EADDC4] rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_rgba(61,35,20,0.06)] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DFAB56] to-[#3D2314] text-white flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#EADDC4]/40">
            <StampyApertureIcon size={24} color="#FAF5EB" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2314] font-serif tracking-tight">
            stampy.
          </h1>
          <p className="text-xs text-[#63574D] mt-1 font-medium">
            {mode === 'pin'
              ? 'دخول طاقم الخدمة والكاونتر عبر رمز PIN'
              : mode === 'signup'
              ? 'إنشاء حساب منشأة جديدة وبدء إدارة الولاء'
              : 'تسجيل الدخول إلى لوحة تحكم المنشأة'}
          </p>
        </div>

        {/* Tabby-style Segmented Control (Tabs) */}
        {mode !== 'pin' && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FAF5EB] border border-[#EADDC4] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-white text-[#3D2314] shadow-xs border border-[#EADDC4]/60'
                  : 'text-[#63574D] hover:text-[#3D2314]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-white text-[#3D2314] shadow-xs border border-[#EADDC4]/60'
                  : 'text-[#63574D] hover:text-[#3D2314]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- SIGN IN / SIGN UP MODES --- */}
        {mode !== 'pin' && (
          <div className="space-y-4">
            {/* Google Fast Action Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#FAF5EB] border border-[#EADDC4] text-[#3D2314] font-semibold text-xs transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>
                {mode === 'signup'
                  ? 'التسجيل السريع بحساب Google'
                  : 'المتابعة بحساب Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-[#EADDC4]" />
              <span className="absolute bg-white px-3 text-[11px] font-medium text-[#A19E9B]">
                أو بالبريد الإلكتروني
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {/* Store Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D2314] mb-1.5">
                    اسم المنشأة أو العلامة التجارية:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: استوديو صويل، لوسيل..."
                      value={cafeName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-white text-xs text-[#3D2314] placeholder-[#A19E9B] focus:border-[#DFAB56] focus:ring-2 focus:ring-[#DFAB56]/20 focus:outline-none transition"
                    />
                    <Store className="w-4 h-4 text-[#A19E9B] absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                  {cafeSlug && (
                    <p className="text-[10px] text-[#63574D] mt-1.5 flex items-center gap-1 font-mono" dir="ltr">
                      <span className="text-[#DFAB56] font-bold">URL:</span>
                      <span className="text-[#63574D]">
                        {hostDomain}/c/{cafeSlug}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#3D2314] mb-1.5">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-white text-xs text-[#3D2314] placeholder-[#A19E9B] focus:border-[#DFAB56] focus:ring-2 focus:ring-[#DFAB56]/20 focus:outline-none transition font-mono"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-[#A19E9B] absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#3D2314]">
                    كلمة المرور:
                  </label>
                  {mode === 'signin' && (
                    <span className="text-[11px] text-[#DFAB56] hover:underline cursor-pointer">
                      نسيت كلمة المرور؟
                    </span>
                  )}
                </div>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#3D2314] hover:bg-[#2A180E] text-white font-bold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {loading ? (
                  <span>جاري المعالجة...</span>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء الحساب وبدء الاستخدام</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch to Staff PIN */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('pin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-[#63574D] hover:text-[#DFAB56] transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>دخول طاقم الخدمة والكاونتر عبر رمز PIN</span>
              </button>
            </div>
          </div>
        )}

        {/* --- STAFF PIN MODE (TABBY STYLE CLEAN 4-DIGIT PAD) --- */}
        {mode === 'pin' && (
          <form onSubmit={handlePinAuth} className="space-y-5">
            <div className="text-center">
              <label className="block text-xs font-semibold text-[#3D2314] mb-3">
                أدخل رمز PIN السري للكاونتر (4 أرقام):
              </label>

              {/* 4 Digit Boxes */}
              <div className="flex items-center justify-center gap-3 my-4" dir="ltr">
                {[0, 1, 2, 3].map((index) => {
                  const digit = pin[index] || '';
                  const isCurrent = pin.length === index;
                  return (
                    <div
                      key={index}
                      className={`w-13 h-14 rounded-xl border flex items-center justify-center text-xl font-bold font-mono transition-all ${
                        digit
                          ? 'border-[#3D2314] bg-[#FAF5EB] text-[#3D2314]'
                          : isCurrent
                          ? 'border-[#DFAB56] bg-white ring-2 ring-[#DFAB56]/20'
                          : 'border-[#EADDC4] bg-white text-transparent'
                      }`}
                    >
                      {digit ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Hidden or real input for direct typing */}
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="opacity-0 absolute -z-10"
                id="pin-direct-input"
              />

              {/* Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mt-4" dir="ltr">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pin.length < 4) setPin((prev) => prev + num);
                    }}
                    className="h-11 rounded-xl bg-[#FAF5EB] hover:bg-[#F5EFE6] active:bg-[#EADDC4] text-base font-bold font-mono text-[#3D2314] transition border border-[#EADDC4]/60 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-11 rounded-xl bg-white hover:bg-rose-50 text-xs font-semibold text-rose-600 transition border border-[#EADDC4]/60 cursor-pointer"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 4) setPin((prev) => prev + '0');
                  }}
                  className="h-11 rounded-xl bg-[#FAF5EB] hover:bg-[#F5EFE6] active:bg-[#EADDC4] text-base font-bold font-mono text-[#3D2314] transition border border-[#EADDC4]/60 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-11 rounded-xl bg-white hover:bg-[#FAF5EB] text-xs font-semibold text-[#63574D] transition border border-[#EADDC4]/60 cursor-pointer"
                >
                  ←
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full py-3.5 px-4 rounded-xl bg-[#3D2314] hover:bg-[#2A180E] text-white font-bold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {loading ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>دخول الكاونتر</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setPin('');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-[#63574D] hover:text-[#3D2314] transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>العودة لدخول المالك والمدير</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#EADDC4] flex items-center justify-between text-[11px] text-[#A19E9B]">
          <span>حماية وتشفير البيانات SSL</span>
          <span className="font-mono text-[#DFAB56] font-semibold">STAMPY SECURE</span>
        </div>
      </div>
    </div>
  );
}
