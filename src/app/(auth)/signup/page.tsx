'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Store,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TicketButton } from '@/components/ui/TicketButton';
import { StampyApertureIcon } from '@/components/brand/StampyLogo';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  'استوديو تصوير وفوتوبوث',
  'كافيه ومحمصة حرفية',
  'مطعم ومأكولات فاخرة',
  'صالون وعناية وسبا',
  'متجر هدايا وتجزئة',
  'فعاليات وترفيه ومناسبات',
];

export default function SignUpPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Owner Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business Profile
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [branchName, setBranchName] = useState('الفرع الرئيسي');
  const [slug, setSlug] = useState('');

  // Step 3: Loyalty Card Program
  const [totalStamps, setTotalStamps] = useState<number>(5);
  const [rewardTitle, setRewardTitle] = useState('هدية تذكارية مجانية عند اكتمال الأختام');

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    const clean = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug(clean || 'my-store');
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('يرجى ملء جميع الحقول للمتابعة.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      setErrorMsg('يرجى إدخال اسم المنشأة أو العلامة التجارية.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        setErrorMsg('تم إنشاء الحساب. افتح رسالة التأكيد في بريدك ثم سجّل الدخول لإكمال تجهيز المنشأة.');
        return;
      }

      const response = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          name,
          businessName,
          slug: slug || 'store',
          branchName,
          category,
          totalStamps,
          rewardTitle,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'تعذر تجهيز المنشأة');
      }

      setStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setErrorMsg('تعذر الاتصال بقاعدة البيانات (Supabase). يرجى التأكد من استئناف المشروع (Unpause) في لوحة تحكم Supabase.');
      } else {
        setErrorMsg(msg || 'تعذر إكمال التسجيل.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF5EB] text-[#3D2314] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative">
      {/* Background radial glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#E5A836]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-[#3D2314]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between relative z-10 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D2314]/70 hover:text-[#3D2314] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#3D2314]">
          <span className="bg-[#E5A836] text-[#3D2314] border border-[#3D2314] px-2.5 py-0.5 rounded-full text-[10px] font-mono">
            خطوة {step} من 3
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white border-2 border-[#3D2314] rounded-2xl p-6 sm:p-8 shadow-stamp-hover relative z-10">
        
        {/* Step Progress Dots */}
        {step !== 4 && (
          <div className="flex items-center justify-center gap-2 mb-6" dir="ltr">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  step === s
                    ? 'w-8 bg-[#B83A26]'
                    : step > s
                    ? 'w-3 bg-[#527E78]'
                    : 'w-3 bg-[#EADDC4]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ---------------- STEP 1: OWNER ACCOUNT ---------------- */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-[#3D2314]" />
              </div>
              <h2 className="text-xl font-black text-[#3D2314]">
                إنشاء حساب صاحب المنشأة
              </h2>
              <p className="text-xs text-[#3D2314]/70 mt-1">
                الخطوة الأولى لبدء إدارة أختام وولاء عملائك باحترافية
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                الاسم الكامل:
              </label>
              <input
                type="text"
                required
                placeholder="محمد سعيد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                البريد الإلكتروني:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition font-mono"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-[#3D2314]/40 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                كلمة المرور:
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <span className="text-[10px] text-[#3D2314]/50 mt-1 block">
                يجب ألا تقل عن 6 أحرف.
              </span>
            </div>

            <TicketButton type="submit" variant="primary" size="md" className="w-full mt-2">
              <span>المتابعة إلى بيانات المنشأة</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </TicketButton>
          </form>
        )}

        {/* ---------------- STEP 2: BUSINESS PROFILE ---------------- */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#527E78] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center mx-auto mb-2 text-white">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-[#3D2314]">
                بيانات المنشأة أو العلامة التجارية
              </h2>
              <p className="text-xs text-[#3D2314]/70 mt-1">
                تحديد الاسم والرابط الذي سيراه العملاء عند فتح الكرت
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                اسم المنشأة أو المتجر:
              </label>
              <input
                type="text"
                required
                placeholder="مثال: استوديو صويل، روز كافيه، فلورا..."
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                نوع النشاط:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                اسم الفرع المبدئي:
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="الفرع الرئيسي"
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition"
              />
            </div>

            {slug && (
              <div className="p-3 rounded-xl bg-[#FAF5EB] border border-[#EADDC4]">
                <span className="text-[10px] font-bold text-[#3D2314]/60 block mb-1">
                  رابط صفحة كرت العميل الخاصة بك:
                </span>
                <span className="font-mono text-xs text-[#B83A26] font-bold" dir="ltr">
                  /c/{slug}
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <TicketButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                className="w-1/3"
              >
                رجوع
              </TicketButton>
              <TicketButton type="submit" variant="primary" size="md" className="w-2/3">
                <span>برنامج الأختام</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </TicketButton>
            </div>
          </form>
        )}

        {/* ---------------- STEP 3: LOYALTY PROGRAM ---------------- */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#B83A26] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center mx-auto mb-2 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-[#3D2314]">
                إعداد كرت الأختام والمكافأة
              </h2>
              <p className="text-xs text-[#3D2314]/70 mt-1">
                حدد عدد الأختام والمكافأة التي يحصل عليها العميل
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-2">
                عدد الأختام المطلوبة لاكتمال الكرت:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalStamps(num)}
                    className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${
                      totalStamps === num
                        ? 'bg-[#E5A836] border-[#3D2314] text-[#3D2314] shadow-stamp-resting'
                        : 'bg-[#FAF5EB] border-[#EADDC4] text-[#3D2314]/70 hover:border-[#3D2314]'
                    }`}
                  >
                    {num} أختام
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2314] mb-1.5">
                عنوان المكافأة عند الاكتمال:
              </label>
              <input
                type="text"
                required
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                placeholder="مثال: هدية تذكارية مجانية، خصم 50%..."
                className="w-full px-3.5 py-3 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Live Stamp Card Preview */}
            <div className="p-4 rounded-xl bg-[#FAF5EB] border-2 border-[#3D2314] shadow-stamp-resting mt-3">
              <div className="flex items-center justify-between border-b border-[#3D2314]/20 pb-2 mb-3">
                <span className="font-bold text-xs text-[#3D2314]">
                  {businessName || 'اسم المنشأة'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#E5A836] text-[#3D2314] px-2 py-0.5 rounded border border-[#3D2314]">
                  STAMP CARD
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2">
                {Array.from({ length: totalStamps }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-lg border-2 border-dashed border-[#3D2314] flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? 'bg-[#B83A26] text-white border-solid'
                        : 'bg-white text-[#3D2314]/40'
                    }`}
                  >
                    {i === 0 ? '✦' : i + 1}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-[10px] text-[#3D2314]/80 font-bold">
                🎁 المكافأة: {rewardTitle}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <TicketButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                className="w-1/3"
                disabled={loading}
              >
                رجوع
              </TicketButton>
              <TicketButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleFinalSubmit}
                className="w-2/3"
                disabled={loading}
              >
                {loading ? 'جاري تجهيز المنصة...' : 'إطلاق المنصة وبدء العمل 🚀'}
              </TicketButton>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4: SUCCESS LAUNCH ---------------- */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#527E78] border-2 border-[#3D2314] shadow-stamp-hover flex items-center justify-center mx-auto text-white">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-[#3D2314]">
              أهلاً بك في stampy.! 🎉
            </h2>
            <p className="text-xs text-[#3D2314]/80 max-w-sm mx-auto">
              تم إنشاء حساب منشأة <span className="font-bold text-[#B83A26]">«{businessName}»</span> وتجهيز كرت الولاء وبرنامج الأختام بنجاح.
            </p>

            <div className="p-3.5 rounded-xl bg-[#FAF5EB] border border-[#EADDC4] text-xs font-mono text-right" dir="ltr">
              <div><span className="font-bold text-[#3D2314]">URL:</span> /c/{slug}</div>
              <div><span className="font-bold text-[#3D2314]">Program:</span> {totalStamps} Stamps → {rewardTitle}</div>
            </div>

            <TicketButton
              variant="primary"
              size="lg"
              className="w-full mt-4"
              onClick={() => {
                window.location.assign('/dashboard');
              }}
            >
              الانتقال إلى لوحة التحكم (Dashboard)
            </TicketButton>
          </div>
        )}

        {/* Footer */}
        {step !== 4 && (
          <div className="mt-5 pt-4 border-t border-[#EADDC4] text-center">
            <p className="text-xs text-[#3D2314]/70">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="font-bold text-[#B83A26] hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
