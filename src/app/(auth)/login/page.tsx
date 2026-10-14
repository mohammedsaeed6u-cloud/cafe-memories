'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coffee,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ChevronLeft,
  UserPlus,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { useAuthPage } from '@/features/auth/hooks/useAuthPage';
import { MerchantSignUpForm } from '@/features/auth/components/MerchantSignUpForm';
import { MerchantSignInForm } from '@/features/auth/components/MerchantSignInForm';
import { StaffPinLoginForm } from '@/features/auth/components/StaffPinLoginForm';
import { TwoFactorVerifyForm } from '@/features/auth/components/TwoFactorVerifyForm';

export default function LoginPage() {
  const auth = useAuthPage();

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col font-sans select-none antialiased justify-between relative overflow-hidden selection:bg-[#DFAB56] selection:text-white">
      {/* Ambient Archival Glows */}
      <div className="fixed top-0 left-0 w-[550px] h-[500px] bg-gradient-to-br from-[#451215]/30 via-[#1A0706]/30 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#DFAB56]/15 via-[#451215]/20 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />

      {/* Top Simple Nav */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFAB56] to-[#682025] text-white flex items-center justify-center shadow-lg border border-white/10">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none text-[#FBF9F5]">ستامبي</span>
            <span className="text-[10px] text-[#DFAB56] font-bold uppercase tracking-wider font-mono">Stampy SaaS</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-[#A19E9B] hover:text-[#FBF9F5] transition flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C1B1B] border border-white/10 hover:bg-[#211F1F]"
        >
          <span>العودة للرئيسية</span>
          <ChevronLeft className="w-4 h-4 text-[#DFAB56]" />
        </Link>
      </header>

      {/* Auth Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-[#181212] border border-[#DFAB56]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#FAF5EB] font-['Plus_Jakarta_Sans',sans-serif]">
              {auth.authTab === 'signup'
                ? 'إنشاء حساب منشأة جديد'
                : auth.authTab === 'signin'
                ? 'تسجيل الدخول للوحة التحكم'
                : auth.authTab === '2fa'
                ? 'التحقق بخطوتين (2FA)'
                : 'دخول طاقم العمل (Staff POS)'}
            </h1>
            <p className="text-xs text-[#D5C0A8] max-w-xs mx-auto leading-relaxed">
              {auth.authTab === 'signup'
                ? 'ابدأ إصدار كروت Apple و Google Wallet وبناء ولاء عملائك خلال 60 ثانية'
                : auth.authTab === 'signin'
                ? 'مرحباً بعودتك! أدخل بيانات حسابك للوصول إلى لوحة المنشأة'
                : auth.authTab === '2fa'
                ? 'أدخل رمز الأمان من تطبيق المصادقة للوصول الآمن لحسابك'
                : 'تسجيل الدخول برمز PIN السريع لطاقم الكاونتر والخدمة'}
            </p>
          </div>

          {/* Segmented Tab Switcher (hidden when in 2FA) */}
          {auth.authTab !== '2fa' && (
            <div className="grid grid-cols-3 p-1.5 bg-[#0E0A0A] rounded-2xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => auth.setAuthTab('signup')}
                className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  auth.authTab === 'signup'
                    ? 'bg-[#682025] text-[#FAF5EB] shadow-xs font-bold border border-[#DFAB56]/40'
                    : 'text-[#A19E9B] hover:text-[#FAF5EB]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>حساب جديد</span>
              </button>

              <button
                type="button"
                onClick={() => auth.setAuthTab('signin')}
                className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  auth.authTab === 'signin'
                    ? 'bg-[#682025] text-[#FAF5EB] shadow-xs font-bold border border-[#DFAB56]/40'
                    : 'text-[#A19E9B] hover:text-[#FAF5EB]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول التاجر</span>
              </button>

              <button
                type="button"
                onClick={() => auth.setAuthTab('pin')}
                className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  auth.authTab === 'pin'
                    ? 'bg-[#682025] text-[#FAF5EB] shadow-xs font-bold border border-[#DFAB56]/40'
                    : 'text-[#A19E9B] hover:text-[#FAF5EB]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>رمز PIN</span>
              </button>
            </div>
          )}

          {/* Error Notice */}
          {auth.errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#451215]/40 border border-[#DFAB56]/40 text-rose-200 font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{auth.errorMsg}</span>
            </div>
          )}

          {/* Success Notice */}
          {auth.successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{auth.successMsg}</span>
            </div>
          )}

          {/* Render Active Form */}
          {auth.authTab === 'signup' && (
            <MerchantSignUpForm
              email={auth.email}
              setEmail={auth.setEmail}
              password={auth.password}
              setPassword={auth.setPassword}
              cafeName={auth.cafeName}
              onCafeNameChange={auth.handleCafeNameChange}
              cafeSlug={auth.cafeSlug}
              setCafeSlug={auth.setCafeSlug}
              setIsSlugManuallyEdited={auth.setIsSlugManuallyEdited}
              loading={auth.loading}
              onSubmit={auth.handleEmailAuth}
              onOAuthLogin={auth.handleOAuthLogin}
            />
          )}

          {auth.authTab === 'signin' && (
            <MerchantSignInForm
              email={auth.email}
              setEmail={auth.setEmail}
              password={auth.password}
              setPassword={auth.setPassword}
              loading={auth.loading}
              onSubmit={auth.handleEmailAuth}
              onOAuthLogin={auth.handleOAuthLogin}
            />
          )}

          {auth.authTab === 'pin' && (
            <StaffPinLoginForm
              pin={auth.pin}
              setPin={auth.setPin}
              loading={auth.loading}
              onSubmit={auth.handlePinAuth}
            />
          )}

          {auth.authTab === '2fa' && (
            <TwoFactorVerifyForm
              twoFactorCode={auth.twoFactorCode}
              setTwoFactorCode={auth.setTwoFactorCode}
              loading={auth.loading}
              onSubmit={auth.handleVerify2FA}
              onBack={() => auth.setAuthTab('signin')}
            />
          )}
        </div>
      </main>

      {/* Footer Simple Note */}
      <footer className="text-center py-4 text-stone-400 text-xs font-medium">
        <span>منصة ستامبي لإدارة برامج الولاء الرقمية وكروت المحفظة © 2026</span>
      </footer>
    </div>
  );
}
