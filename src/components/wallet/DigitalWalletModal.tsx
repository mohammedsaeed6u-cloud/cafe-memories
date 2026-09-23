'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Check,
  ExternalLink,
  Award,
  Sparkles,
  QrCode,
  RotateCw,
  Gift,
} from 'lucide-react';
import {
  DigitalWalletService,
  type DigitalWalletPassData,
} from '@/lib/services/digital-wallet.service';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

interface DigitalWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: DigitalWalletPassData;
}

export const DigitalWalletModal: React.FC<DigitalWalletModalProps> = ({
  isOpen,
  onClose,
  passData,
}) => {
  const [activeWallet, setActiveWallet] = useState<'apple' | 'google'>('apple');
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const {
    cafeName,
    cafeSlug,
    customerPhone,
    customerName = 'ضيف مميز',
    stampedCount,
    maxSlots,
    giftTitle = 'مشروب مجاني مميز',
    instagramHandle,
  } = passData;

  const cleanPhone = (customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
  const qrValue = `https://memories-c9w.pages.dev/c/${cafeSlug}?action=stamp&customer=${cleanPhone}`;

  const handleDownloadApplePass = () => {
    DigitalWalletService.downloadApplePass(passData);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleSaveGoogleWallet = () => {
    const url = DigitalWalletService.generateGoogleWalletSaveUrl(passData);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-cairo animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF9F6] border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-950">
                حفظ كارت الذكريات في المحفظة
              </h3>
              <p className="text-[11px] text-stone-500">
                ليبقى الكارت ذكرى دائمة في هاتفك برمز الـ QR الخاص بك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallet Switcher Tabs */}
        <div className="px-6 pt-4 pb-2 flex gap-2">
          <button
            onClick={() => {
              setActiveWallet('apple');
              setIsFlipped(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeWallet === 'apple'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {/* Apple Logo SVG */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.9-14.24-6.42-9.87-11.45-21.36-15.08-34.46-3.64-13.1-5.46-24.81-5.46-35.13 0-14.28 3.58-25.99 10.74-35.13 7.16-9.14 16.27-13.82 27.32-14.05 4.88 0 10.23 1.25 16.06 3.75 5.83 2.5 9.77 3.86 11.83 4.08 1.84-.22 5.92-1.63 12.24-4.24 6.33-2.61 11.66-3.79 16.01-3.53 15.03.88 26.38 6.23 34.05 16.06-13.1 7.94-19.54 18.83-19.32 32.65.22 10.77 4.3 19.68 12.24 26.74 4.03 3.6 8.54 6.26 13.53 7.99-2.61 7.73-5.77 15.46-9.47 23.19zM119.22 31.84c0-7.72 2.77-15.01 8.31-21.87 5.54-6.85 12.35-11.08 20.43-12.69.87 8.05-1.52 15.56-7.18 22.52-5.65 6.96-12.83 11.16-21.56 12.04z" />
            </svg>
            <span>Apple Wallet</span>
          </button>
          <button
            onClick={() => {
              setActiveWallet('google');
              setIsFlipped(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeWallet === 'google'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {/* Google G Logo SVG */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google Wallet</span>
          </button>
        </div>

        {/* Modal Body / Pass Interactive Preview */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          {/* Flip Card Container */}
          <div className="w-full max-w-[320px] relative transition-transform duration-300">
            {/* FRONT OF PASS */}
            {!isFlipped ? (
              <div className="w-full rounded-2xl bg-stone-900 text-white p-5 border border-stone-800 shadow-xl flex flex-col justify-between space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 gap-2">
                  <CoBrandingLogos
                    cafeName={cafeName}
                    size="sm"
                    theme="dark"
                    showTagline={false}
                  />
                  <div className="text-left shrink-0">
                    <span className="text-[9px] text-amber-400 font-bold block">
                      الأختام
                    </span>
                    <span className="text-sm font-black font-mono text-white" dir="ltr">
                      {stampedCount} / {maxSlots}
                    </span>
                  </div>
                </div>

                {/* Reward Callout */}
                <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[9px] text-stone-400 block font-bold">
                        المكافأة المقررة
                      </span>
                      <span className="text-xs font-bold text-amber-200">
                        {giftTitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-900 text-stone-300">
                    {stampedCount >= maxSlots ? 'جاهز' : `متبقي ${maxSlots - stampedCount}`}
                  </span>
                </div>

                {/* Stamp Slots Visual (خانات الكارت والأختام) */}
                <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-300 font-bold flex items-center gap-1.5">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>خانات كارت الزيارات:</span>
                    </span>
                    <span className="text-amber-400 font-mono font-bold" dir="ltr">
                      {stampedCount} / {maxSlots}
                    </span>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${Math.min(maxSlots, 5)}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: maxSlots }).map((_, idx) => {
                      const isStamped = idx < stampedCount;
                      const isGiftSlot = idx === maxSlots - 1;
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                            isStamped
                              ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-sm'
                              : isGiftSlot
                              ? 'bg-stone-900/90 border-dashed border-amber-500/70 text-amber-400'
                              : 'bg-stone-900/70 border-dashed border-stone-700 text-stone-500'
                          }`}
                        >
                          {isStamped ? (
                            <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                          ) : isGiftSlot ? (
                            <Gift className="w-4 h-4 text-amber-400" />
                          ) : (
                            <span className="font-mono text-[11px] font-bold text-stone-400">{idx + 1}</span>
                          )}
                          <span className={`text-[7px] font-mono mt-0.5 ${isStamped ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                            {isGiftSlot ? 'هدية' : `#0${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real Scannable Barcode QR */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-stone-950 text-center shadow-xs">
                  <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                    <RealOutsourcedQr
                      value={qrValue}
                      size={92}
                      alt="Wallet Barcode"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-stone-500 font-bold mt-1">
                    امسح عند الكاشير للختم الفوري
                  </span>
                </div>

                {/* Footer / Customer Name & Flip */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                  <div>
                    <span className="text-[9px] block text-stone-500">حامل البطاقة:</span>
                    <span className="font-bold text-stone-200">{customerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>خلفية الكارت</span>
                  </button>
                </div>
              </div>
            ) : (
              /* BACK OF PASS */
              <div className="w-full rounded-2xl bg-stone-900 text-white p-5 border border-stone-800 shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400">
                    تفاصيل الكارت والشروط
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="inline-flex items-center gap-1 text-[10px] text-stone-300 hover:text-white cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>الواجهة</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-stone-300 leading-relaxed">
                  <div>
                    <span className="text-[10px] text-stone-500 block font-bold">
                      حساب الإنستجرام للمنشن:
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {instagramHandle || `@${cafeSlug}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block font-bold">
                      الرابط الدائم:
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 block truncate">
                      memories-c9w.pages.dev/c/{cafeSlug}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block font-bold">
                      شروط الاستخدام:
                    </span>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      صالح لجميع زيارات الكافيه. يتم ختم خانة عند كل زيارة مع طلب، وتُصرف الهدية تلقائياً عند استكمال الأختام المقررة.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 text-center">
                  <span className="text-[9px] font-mono text-stone-500">
                    POWERED BY MEMORIES WALLET ENGINE v2.0
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-500 text-center mt-4 max-w-xs leading-relaxed">
            {activeWallet === 'apple'
              ? 'يتم تنزيل ملف .pkpass المعتمد ليظهر الكارت تلقائياً في تطبيق Apple Wallet وشاشة القفل عند وصولك للمقهى.'
              : 'يتم حفظ بطاقة الولاء مباشرة في حساب Google Wallet لتصل إليها بكبسة زر بدون أي تطبيق إضافي.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-stone-600 font-bold">
            {downloadSuccess ? (
              <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" />
                تم التنزيل بنجاح! افتح الملف للإضافة للمحفظة.
              </span>
            ) : (
              'حفظ فوري بدون تسجيل دخول'
            )}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeWallet === 'apple' ? (
              <button
                type="button"
                onClick={handleDownloadApplePass}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>إضافة إلى Apple Wallet (.pkpass)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveGoogleWallet}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>حفظ في Google Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
