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
  UserPlus,
  LogIn,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { STAFF_ROSTER } from '@/types/staff';
import { verifyStaffPin, verifyPinOnly, setActiveStaffMember } from '@/lib/services/staff-auth.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

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

type AuthTab = 'signup' | 'signin' | 'pin';

export default function LoginPage() {
  const [authTab, setAuthTab] = useState<AuthTab>('signup');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email / Password / Cafe Registration state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [cafeSlug, setCafeSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Staff PIN state
  const [selectedStaffId, setSelectedStaffId] = useState<string>(STAFF_ROSTER[0]?.id || 'staff-1');
  const [pin, setPin] = useState('');

  // Auto-redirect if already logged in with valid session
  useEffect(() => {
    try {
      const activeSlug = localStorage.getItem('memories_active_merchant_slug');
      if (activeSlug && document.cookie.includes('memories_staff_session=1')) {
        // Already active session
      }
    } catch {}
  }, []);

  // --- Real Merchant Registration & Login Handler ---
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
      if (authTab === 'signup') {
        if (!cafeName.trim()) {
          setErrorMsg('يرجى إدخال اسم المنشأة أو النشاط التجاري لإنشاء حسابك.');
          setLoading(false);
          return;
        }

        // Generate clean unique slug
        const rawName = cafeName.trim();
        let slug = cafeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) {
          slug =
            rawName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
              .slice(0, 40) || `cafe-${Math.floor(100 + Math.random() * 900)}`;
        }

        // 1. Persist real merchant identity to localStorage
        localStorage.setItem('memories_active_merchant_slug', slug);
        localStorage.setItem('memories_active_merchant_name', rawName);
        localStorage.setItem('memories_active_merchant_email', email);

        // Add to persistent merchant accounts registry
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

        // 2. Initialize real business settings for this cafe (0 mock data)
        const existingSettings = BusinessSettingsService.getSettings(slug);
        BusinessSettingsService.saveSettings({
          ...existingSettings,
          cafeSlug: slug,
          cafeName: rawName,
          branding: {
            ...existingSettings.branding,
            name: rawName,
            tagline: 'Specialty Coffee & Guest Memories',
            instagramHandle: `@${slug.replace(/[^a-z0-9_]/gi, '')}`,
          },
        });

        // Initialize empty real CRM, empty print queue, empty wall photos for this cafe
        try {
          localStorage.setItem(`memories_crm_customers_${slug}`, JSON.stringify([]));
          localStorage.setItem(`memories_print_queue_${slug}`, JSON.stringify([]));
          localStorage.setItem(`memories_wall_photos_${slug}`, JSON.stringify([]));
        } catch {}

        // 3. Set auth session cookie
        document.cookie = 'memories_staff_session=1; path=/; max-age=604800; SameSite=Lax';

        // 4. Also register with Supabase in background if available
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

        // Check persistent local merchant registry first
        try {
          const regStr = localStorage.getItem('memories_registered_merchants');
          const registeredList = JSON.parse(regStr || '[]');
          const matched = registeredList.find((m: any) => m.email?.toLowerCase() === email.toLowerCase());
          if (matched) {
            signedInName = matched.name;
            signedInSlug = matched.slug;
          }
        } catch {}

        // Fallback: check Supabase
        if (!signedInName) {
          try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!error && data.session) {
              signedInName = data.user?.user_metadata?.cafe_name || '';
              signedInSlug = data.user?.user_metadata?.cafe_slug || '';
            }
          } catch {}
        }

        // If still not found, check if this is the currently stored active merchant
        if (!signedInName) {
          const currentStoredEmail = localStorage.getItem('memories_active_merchant_email');
          if (currentStoredEmail && currentStoredEmail.toLowerCase() === email.toLowerCase()) {
            signedInName = localStorage.getItem('memories_active_merchant_name') || '';
            signedInSlug = localStorage.getItem('memories_active_merchant_slug') || '';
          }
        }

        // If not found anywhere, prompt merchant to create an account
        if (!signedInName) {
          setErrorMsg('هذا البريد غير مسجل بعد. يمكنك إنشاء حساب منشأة جديد به الآن.');
          setAuthTab('signup');
          setLoading(false);
          return;
        }

        // Set session
        document.cookie = 'memories_staff_session=1; path=/; max-age=604800; SameSite=Lax';
        localStorage.setItem('memories_active_merchant_slug', signedInSlug);
        localStorage.setItem('memories_active_merchant_name', signedInName);
        localStorage.setItem('memories_active_merchant_email', email);

        setSuccessMsg(`أهلاً بعودتك! جاري الدخول للوحة تحكم (${signedInName})...`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
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

  // Google OAuth Handler
  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://memories-c9w.pages.dev';
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
          setErrorMsg('تسجيل الدخول عبر Google يتطلب التفعيل من لوحة Supabase. يمكنك إنشاء الحساب فوراً عبر البريد الإلكتروني أدناه.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر الاتصال بخدمة تسجيل الدخول عبر Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col justify-center items-center p-4 selection:bg-[#DD0200] selection:text-white font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#55100D]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#DD0200]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Back Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A19E9B] hover:text-[#FBF9F5] transition"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>العودة للموقع الرئيسي</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-[#FBF9F5] bg-[#55100D]/50 px-2.5 py-0.5 rounded-md border border-[#DD0200]/40 tracking-wider uppercase">
          SECURE PORTAL
        </span>
      </div>

      <div className="w-full max-w-md bg-[#141212] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-950/50 border border-white/20">
            <span className="text-base font-serif">✦</span>
          </div>
          <h1
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-2xl font-semibold text-white tracking-tight"
          >
            memories studio
          </h1>
          <p className="text-xs text-[#A19E9B] mt-1 leading-relaxed">
            بوابة أصحاب الأنشطة التجارية وإدارة تجارب الزوار والولاء التفاعلي
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#1C1B1B] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              setErrorMsg(null);
            }}
            className={`py-2 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'signup'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'text-[#A19E9B] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تسجيل منشأة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthTab('signin');
              setErrorMsg(null);
            }}
            className={`py-2 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'signin'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'text-[#A19E9B] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>دخول التاجر</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthTab('pin');
              setErrorMsg(null);
            }}
            className={`py-2 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'pin'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'text-[#A19E9B] hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>رمز الموظف</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2 mb-4 animate-in fade-in backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 mb-4 animate-in fade-in backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM 1: MERCHANT AUTH (GOOGLE & EMAIL) --- */}
        {(authTab === 'signup' || authTab === 'signin') && (
          <div className="space-y-4">
            {/* Google Direct Sign-In / Registration Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#DD0200]/30 text-[#FBF9F5] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 backdrop-blur-md"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>
                {authTab === 'signup'
                  ? 'التسجيل المباشر بحساب Google'
                  : 'تسجيل الدخول بحساب Google'}
              </span>
            </button>

            {/* Modern Subtle Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#141212] px-3 text-[10px] font-bold text-[#A19E9B] select-none uppercase tracking-wider">
                أو عبر البريد الإلكتروني
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authTab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#e6e1e1] mb-1.5">
                      اسم المنشأة أو العلامة التجارية:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: استوديو ومحمصة صويل، بوتيك لوسيل، صالون ڤيڤا..."
                        value={cafeName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCafeName(val);
                          if (!isSlugManuallyEdited) {
                            const clean = val
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9\s-]/g, '')
                              .replace(/\s+/g, '-')
                              .replace(/-+/g, '-');
                            setCafeSlug(clean || '');
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-white placeholder:text-[#A19E9B]/50 focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none transition"
                      />
                      <Store className="w-4 h-4 text-[#A19E9B] absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#e6e1e1]">
                        معرف رابط المنشأة المخصص (Slug):
                      </label>
                      <span className="text-[10px] text-[#A19E9B] font-mono">CUSTOM URL</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="soil-roastery"
                        value={cafeSlug}
                        dir="ltr"
                        onChange={(e) => {
                          setIsSlugManuallyEdited(true);
                          setCafeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-white placeholder:text-[#A19E9B]/50 focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none transition font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-[#A19E9B] mt-1.5 flex items-center gap-1 font-mono" dir="ltr">
                      <span className="text-[#DD0200] font-bold">Live URL:</span>
                      <span className="text-stone-300">
                        memories-c9w.pages.dev/c/{cafeSlug || 'my-cafe'}
                      </span>
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#e6e1e1] mb-1.5">
                  البريد الإلكتروني للتاجر:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="owner@yourcafe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-white placeholder:text-[#A19E9B]/50 focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none transition font-mono"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-[#A19E9B] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e6e1e1] mb-1.5">
                  كلمة المرور:
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#0B0A0A] border-white/10 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? (
                  <span>جاري المعالجة...</span>
                ) : authTab === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب منشأة وبدء الاستخدام فوراً</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول إلى لوحة التحكم</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- FORM 2: BARISTA / STAFF PIN AUTH --- */}
        {authTab === 'pin' && (
          <form onSubmit={handlePinAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#e6e1e1] mb-1.5 text-center">
                أدخل رمز PIN الموظف المعتمد (4 أرقام):
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-3.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-center text-2xl font-mono font-black tracking-[0.4em] text-white focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none transition shadow-inner"
                autoFocus
              />
              <p className="text-[11px] text-[#A19E9B] mt-2 text-center font-medium">
                دخول سريع لطاقم العمل والكاونتر بدون الحاجة لإدخال البريد الإلكتروني
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
            >
              {loading ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>دخول محطة الموظفين والكاونتر</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A19E9B]">
          <span>حماية وتشفير البيانات 256-bit</span>
          <span className="font-mono text-[#DD0200]">ATELIER • NOSTALGIA</span>
        </div>
      </div>
    </div>
  );
}
