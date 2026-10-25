'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

/**
 * First-run onboarding for a signed-in account that is not attached to a
 * venue yet. Kept out of DashboardClient so the dashboard stays focused on
 * operating an existing venue.
 */

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function OnboardingPanel({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [branchName, setBranchName] = useState('الفرع الرئيسي');
  const [rewardTitle, setRewardTitle] = useState('هدية ترحيبية عند اكتمال البطاقة');
  const [totalStamps, setTotalStamps] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          slug: slug.trim().toLowerCase(),
          branchName: branchName.trim(),
          totalStamps,
          rewardTitle: rewardTitle.trim(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) throw new Error(body.error || 'تعذر تجهيز المنشأة');
      onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر تجهيز المنشأة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] p-4 font-sans text-[#FAF5EB]">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-2xl"
      >
        <div className="space-y-1 border-b border-white/10 pb-3">
          <h1 className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-4 w-4 text-[#DFAB56]" />
            جهّز منشأتك
          </h1>
          <p className="text-xs text-[#A19E9B]">
            حسابك جاهز لكنه غير مرتبط بمنشأة بعد. أدخل بيانات المكان لإنشاء أول فرع وبطاقة ولاء.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#A19E9B]">
            اسمك
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            اسم المنشأة
            <input
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            رابط المنشأة
            <input
              required
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              placeholder="my-cafe"
              pattern="[a-z0-9][a-z0-9-]{1,79}"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            اسم الفرع
            <input
              required
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B] sm:col-span-2">
            اسم المكافأة
            <input
              required
              value={rewardTitle}
              onChange={(event) => setRewardTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B] sm:col-span-2">
            عدد الزيارات المطلوبة: {totalStamps}
            <input
              type="range"
              min={2}
              max={20}
              value={totalStamps}
              onChange={(event) => setTotalStamps(Number(event.target.value))}
              className="mt-2 w-full accent-[#DFAB56]"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          إنشاء المنشأة
        </button>

        <Link href="/login" className="block text-center text-[11px] text-[#A19E9B] hover:text-[#FAF5EB]">
          تسجيل الدخول بحساب آخر
        </Link>
      </form>
    </div>
  );
}
