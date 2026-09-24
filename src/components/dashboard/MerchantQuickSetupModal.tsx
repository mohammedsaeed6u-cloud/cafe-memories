'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Coffee,
  Sparkles,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Printer,
  ArrowRight,
  ArrowLeft,
  X,
  Smartphone,
  CreditCard,
  Gift,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { BusinessSettings, StripOrientation } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { PrintService } from '@/lib/services/print.service';

interface MerchantQuickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BusinessSettings;
  onSettingsSaved: (updatedSettings: BusinessSettings) => void;
}

export const MerchantQuickSetupModal: React.FC<MerchantQuickSetupModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsSaved,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cafeName, setCafeName] = useState(
    currentSettings.cafeSlug === 'memories' ? '' : (currentSettings.branding?.name || '')
  );
  const [cafeSlug, setCafeSlug] = useState(
    currentSettings.cafeSlug === 'memories' ? '' : (currentSettings.cafeSlug || '')
  );
  const [orientation, setOrientation] = useState<StripOrientation>(currentSettings.defaultOrientation || 'vertical');
  const [shotCount, setShotCount] = useState<number>(currentSettings.defaultShotCount || 3);
  const [giftTitle, setGiftTitle] = useState(currentSettings.freeGiftOffer?.title || 'كوب قهوة مختصة مجاني');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printStandRef = useRef<HTMLDivElement>(null);

  // Auto-slug generator when user types cafe name
  const handleCafeNameChange = (val: string) => {
    setCafeName(val);
    const generated = val
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9ء-ي]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (generated) {
      setCafeSlug(generated);
    }
  };

  const customerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/c/${cafeSlug}`
    : `https://memories-c9w.pages.dev/c/${cafeSlug}`;

  // Generate QR code whenever cafeSlug changes or when reaching step 3
  useEffect(() => {
    QRCode.toDataURL(customerUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [customerUrl]);

  if (!isOpen) return null;

  const handleSaveAndLaunch = () => {
    const updated: BusinessSettings = {
      ...currentSettings,
      cafeSlug: cafeSlug.trim() || 'my-cafe',
      cafeName: cafeName.trim() || 'كافيه الذكريات',
      branding: {
        ...currentSettings.branding,
        name: cafeName.trim() || 'كافيه الذكريات',
      },
      defaultOrientation: orientation,
      defaultShotCount: shotCount,
      loyaltyMaxVisits: shotCount,
      freeGiftOffer: {
        ...currentSettings.freeGiftOffer,
        title: giftTitle.trim() || 'كوب قهوة مجاني',
        subtitle: `عند إكمال ${shotCount} زيارات للكافيه`,
      },
      frames: currentSettings.frames.map((f) => ({
        ...f,
        orientation: orientation,
        shotCount: shotCount,
      })),
    };

    BusinessSettingsService.saveSettings(updated);
    onSettingsSaved(updated);
    setStep(3);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(customerUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${cafeSlug}-table-stand.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintStand = () => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('table-stand-print')) {
      PrintService.printTableStand('table-stand-print', {
        title: `ستاند طاولة - ${cafeName}`,
        cafeName,
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6 font-cairo text-right">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">إعداد كافيهك في 60 ثانية</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  إطلاق فوري
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                اضبط اسم مكانك، عدد الزيارات، وشكل الكارت، واستلم رابط الطاولات والـ QR فوراً
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-stone-800/80 text-[11px] font-bold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-amber-400' : 'text-stone-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>
                1
              </span>
              <span>هوية الكافيه</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-amber-400' : 'text-stone-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>
                2
              </span>
              <span>نظام الكارت والزيارات</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-amber-400' : 'text-stone-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>
                3
              </span>
              <span>الرابط و QR الطاولة</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Cafe Identity */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  اسم الكافيه أو العلامة التجارية <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={cafeName}
                    onChange={(e) => handleCafeNameChange(e.target.value)}
                    placeholder="مثال: Artisan Roastery • محمصة ومقهى"
                    className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  رابط الكافيه المخصص للعملاء (Custom Slug) <span className="text-amber-600">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200 px-3.5 py-3 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition">
                  <span className="text-xs font-mono font-bold text-stone-400 select-none ltr">
                    memories.dev/c/
                  </span>
                  <input
                    type="text"
                    value={cafeSlug}
                    onChange={(e) => setCafeSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="my-cafe"
                    className="w-full bg-transparent text-stone-900 font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  هذا هو الرابط الفريد الذي سيفتحه عملاؤك عند مسح الـ QR على الطاولة
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  <strong>فكرة بسيطة، تأثير هائل:</strong> العميل يمسح الكود على الطاولة، يوثق لقطة الزيارة برقم هاتفه بدون أي كلمة مرور، ويعود لملء بقية الخانات للحصول على هديته.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!cafeName.trim() || !cafeSlug.trim()}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <span>التالي: نظام الكارت والزيارات</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Card Type & Visits */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2.5">
                  نوع الكارت المعتمد لجميع الزوار (Authoritative Card Style)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setOrientation('vertical')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      orientation === 'vertical'
                        ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-stone-900">كارت طولي (Photo Strip)</h4>
                          <span className="text-[10px] text-amber-700 font-bold">النمط الكوري الكلاسيكي</span>
                        </div>
                      </div>
                      {orientation === 'vertical' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                      شريط صور عمودي (Photo Booth) مثالي للمشاركة على ستوري إنستغرام وتيك توك وللطباعة الورقية الفورية.
                    </p>
                  </div>

                  <div
                    onClick={() => setOrientation('horizontal')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      orientation === 'horizontal'
                        ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-stone-900">كارت أفقي (Digital Wallet Pass)</h4>
                          <span className="text-[10px] text-stone-600 font-bold">نمط بطاقة محفظة آبل</span>
                        </div>
                      </div>
                      {orientation === 'horizontal' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                      بطاقة رقمية فخمة بنمط المحفظة الرقمية، مريحة للنظر وتظهر جميع أختام الزيارات في صف أفقي واحد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Number of Visits */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  عدد الزيارات المطلوبة لملء الكارت <span className="text-amber-600">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setShotCount(count)}
                      className={`py-3 px-2 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        shotCount === count
                          ? 'border-amber-500 bg-amber-500 text-stone-950 shadow-md'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                      }`}
                    >
                      <span className="text-base font-mono">{count}</span>
                      <span className="text-[10px] font-medium">زيارات</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  الكافيه يحدد عدد الزيارات بحرية كاملة، والـ 5 زيارات هي الأكثر استخداماً وتشجيعاً في الكافيهات.
                </p>
              </div>

              {/* Reward Offer */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  هدية إكمال الكارت (التي تظهر للعميل) <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={giftTitle}
                    onChange={(e) => setGiftTitle(e.target.value)}
                    placeholder="مثال: كوب قهوة مختصة مجاني أو خصم 50%"
                    className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl border border-stone-200 text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndLaunch}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black text-sm flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition active:scale-[0.98] cursor-pointer"
                >
                  <span>تفعيل واستلام الرابط والـ QR</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Instant Launch & QR Kit */}
          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black mx-auto shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-stone-950 pt-1">
                  تم إعداد وتفعيل كافيه {cafeName} بنجاح!
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  منظومة الذكريات والولاء جاهزة فوراً. اطبع كود الطاولات أو شارك الرابط المباشر مع أول عميل يدخل الكافيه.
                </p>
              </div>

              {/* Direct Link Box */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-700">رابط كرت الذكريات المباشر لعملائك:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={customerUrl}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 font-mono text-xs font-bold text-stone-900 ltr select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-800 hover:bg-stone-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>

              {/* Printable Table Tent Preview Card */}
              <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-6 rounded-3xl border border-stone-200/90 text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-bold border border-amber-500/20">
                  <span>ستاند الطاولات الجاهز للطباعة</span>
                  
                </div>

                <div
                  ref={printStandRef}
                  id="table-stand-print"
                  className="max-w-[260px] mx-auto bg-white p-5 rounded-2xl border-2 border-stone-800 shadow-md flex flex-col items-center space-y-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-800 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                    M
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-950 leading-tight">{cafeName}</h4>
                    <p className="text-[9px] text-stone-500 font-mono mt-0.5">Memories &amp; Loyalty Pass</p>
                  </div>

                  {qrDataUrl && (
                    <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="Table QR Code" className="w-40 h-40 object-contain" />
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-stone-900">
                      امسح بكاميرا هاتفك لتوثيق ذكرى اليوم
                    </p>
                    <p className="text-[9px] text-amber-800 font-bold">
                      أكمل {shotCount} زيارات واحصل على {giftTitle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-600" />
                    <span>تحميل الـ QR (صورة PNG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintStand}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة ستاند الأكريليك</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <a
                  href={`/c/${cafeSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>فتح كارت العميل في نافذة جديدة</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition cursor-pointer shadow-sm"
                >
                  الدخول للوحة التحكم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
