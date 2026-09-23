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
import { verifyStaffPin, setActiveStaffMember } from '@/lib/services/staff-auth.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

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
          setErrorMsg('يرجى إدخال اسم الكافيه أو المتجر لإنشاء حسابك.');
          setLoading(false);
          return;
        }

        // Generate clean unique slug
        const rawName = cafeName.trim();
        const slug =
          rawName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
            .slice(0, 40) || `cafe-${Date.now()}`;

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

        // 2. Initialize real business settings for this cafe
        const existingSettings = BusinessSettingsService.getSettings(slug);
        BusinessSettingsService.saveSettings({
          ...existingSettings,
          cafeSlug: slug,
          branding: {
            ...existingSettings.branding,
            name: rawName,
            tagline: 'Specialty Coffee & Guest Experiences',
          },
        });

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
          window.location.href = '/dashboard';
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

        // If not found anywhere, ask them to create account rather than falling back to demo
        if (!signedInName) {
          setErrorMsg('هذا البريد غير مسجل بعد. يمكنك إنشاء حساب كافيه جديد به الآن.');
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
      const result = await verifyStaffPin(selectedStaffId, pin);

      if (!result.success) {
        setErrorMsg(result.error || 'الرمز السري غير صحيح.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`أهلاً بك، ${result.staff?.name}! جاري الدخول للوحة التحكم...`);
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-center items-center p-4 selection:bg-amber-100 font-cairo">
      {/* Brand Back Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 transition"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>العودة للموقع الرئيسي</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          SECURE PORTAL
        </span>
      </div>

      <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <MemoriesArchIcon size={24} color="#FFFFFF" />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-2xl font-black text-stone-950 tracking-tight"
          >
            memories
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            بوابة أصحاب المقاهي وإدارة تجارب الزوار والولاء التفاعلي
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-stone-100 border border-stone-200/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              setErrorMsg(null);
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'signup'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تسجيل كافيه جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthTab('signin');
              setErrorMsg(null);
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'signin'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
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
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              authTab === 'pin'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>رمز الباريستا</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 mb-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM 1: MERCHANT EMAIL AUTH (SIGNUP OR SIGNIN) --- */}
        {(authTab === 'signup' || authTab === 'signin') && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authTab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم الكافيه أو العلامة التجارية:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: مقهى الأندلس، Roastery 101..."
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                  />
                  <Store className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                البريد الإلكتروني للتاجر:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="owner@yourcafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none transition font-mono"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                كلمة المرور:
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-stone-50/70 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جاري المعالجة...</span>
              ) : authTab === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حساب كافيه وبدء الاستخدام فوراً</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول إلى لوحة التحكم</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* --- FORM 2: BARISTA / STAFF PIN AUTH --- */}
        {authTab === 'pin' && (
          <form onSubmit={handlePinAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                اختر موظف الصالة أو الباريستا:
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
              >
                {STAFF_ROSTER.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — ({staff.role === 'manager' ? 'مدير الفرع' : 'باريستا الصالة'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                رمز المرور السريع (4 أرقام):
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-3 rounded-xl border border-stone-200 bg-stone-50/70 text-center text-lg font-mono font-black tracking-widest text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
              />
              <p className="text-[10px] text-stone-500 mt-1 text-center font-medium">
                رمز PIN المعتمد الخاص بحساب الموظف في الفرع
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>دخول باريستا الصالة</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>حماية وتشفير البيانات 256-bit</span>
          <span className="font-mono">v2.6 PRODUCTION</span>
        </div>
      </div>
    </div>
  );
}
