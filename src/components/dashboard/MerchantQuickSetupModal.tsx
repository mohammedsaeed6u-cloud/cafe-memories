'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
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
  Store,
  Scissors,
  Utensils,
  Ticket,
  Gamepad2,
  Coffee,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { BusinessSettings, StripOrientation, BusinessType } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { PrintService } from '@/lib/services/print.service';
import { BUSINESS_INDUSTRY_OPTIONS, getIndustryProfile } from '@/lib/constants/photobooth-presets';
import { ImageSaveService } from '@/lib/services/image-save.service';

interface MerchantQuickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BusinessSettings;
  onSettingsSaved: (updatedSettings: BusinessSettings) => void;
}

const INDUSTRY_ICONS: Record<string, any> = {
  cafe: Coffee,
  restaurant: Utensils,
  retail: ShoppingBag,
  salon: Scissors,
  entertainment: Gamepad2,
  events: Ticket,
  general: Store,
};

export const MerchantQuickSetupModal: React.FC<MerchantQuickSetupModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsSaved,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [businessType, setBusinessType] = useState<BusinessType>(
    currentSettings.businessType || 'general'
  );

  const [cafeName, setCafeName] = useState(
    currentSettings.cafeSlug === 'memories' ? '' : (currentSettings.branding?.name || '')
  );
  const [cafeSlug, setCafeSlug] = useState(
    currentSettings.cafeSlug === 'memories' ? '' : (currentSettings.cafeSlug || '')
  );
  const [orientation, setOrientation] = useState<StripOrientation>(
    currentSettings.defaultOrientation || 'vertical'
  );
  const [shotCount, setShotCount] = useState<number>(currentSettings.defaultShotCount || 3);

  const currentProfile = getIndustryProfile(businessType);
  const [giftTitle, setGiftTitle] = useState(
    currentSettings.freeGiftOffer?.title || currentProfile.defaultGiftTitle
  );
  const [giftSubtitle, setGiftSubtitle] = useState(
    currentSettings.freeGiftOffer?.subtitle || currentProfile.defaultGiftSubtitle
  );

  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // When industry changes, adapt defaults
  const handleSelectIndustry = (type: BusinessType) => {
    setBusinessType(type);
    const prof = getIndustryProfile(type);
    setGiftTitle(prof.defaultGiftTitle);
    setGiftSubtitle(prof.defaultGiftSubtitle);
  };

  // Auto-slug generator when user types business name
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
    if (!cafeSlug) return;
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
  }, [customerUrl, cafeSlug]);

  if (!isOpen) return null;

  const handleSaveAndLaunch = () => {
    const prof = getIndustryProfile(businessType);
    const resolvedName = cafeName.trim() || 'متجر ومساحة الذكريات';
    const resolvedSlug = cafeSlug.trim() || 'my-store';

    const updated: BusinessSettings = {
      ...currentSettings,
      businessType,
      cafeSlug: resolvedSlug,
      cafeName: resolvedName,
      branding: {
        ...currentSettings.branding,
        name: resolvedName,
      },
      defaultOrientation: orientation,
      defaultShotCount: shotCount,
      loyaltyMaxVisits: shotCount,
      freeGiftOffer: {
        ...currentSettings.freeGiftOffer,
        title: giftTitle.trim() || prof.defaultGiftTitle,
        subtitle: giftSubtitle.trim() || prof.defaultGiftSubtitle,
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
    ImageSaveService.saveImage({
      dataUrl: qrDataUrl,
      filename: `qr-${cafeSlug}-table-stand.png`,
      title: `رمز QR ستاند - ${cafeName}`,
    }).catch((err) => {
      console.warn('QR download failed:', err);
    });
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
            className="absolute top-5 left-5 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">إعداد نشاطك التجاري في 60 ثانية</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  إطلاق فوري
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                حدد نوع نشاطك التجاري، اسم علامتك، وشكل الكارت، واستلم الـ QR فوراً
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-stone-800/80 text-[11px] font-bold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-amber-400' : 'text-stone-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>
                1
              </span>
              <span>نوع النشاط والهوية</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-amber-400' : 'text-stone-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>
                2
              </span>
              <span>نظام الكارت والمكافأة</span>
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
          {/* STEP 1: Industry & Business Identity */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Industry Grid Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  اختر نوع النشاط التجاري (Industry Type) <span className="text-amber-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUSINESS_INDUSTRY_OPTIONS.map((opt) => {
                    const IconComponent = INDUSTRY_ICONS[opt.id] || Store;
                    const isSelected = businessType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectIndustry(opt.id as BusinessType)}
                        className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-stone-950 ring-2 ring-amber-500/30 font-bold'
                            : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-stone-500'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold block">{opt.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  اسم المنشأة أو العلامة التجارية <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={cafeName}
                    onChange={(e) => handleCafeNameChange(e.target.value)}
                    placeholder={
                      businessType === 'retail'
                        ? 'مثال: بوتيك ڤيلفيت للأزياء'
                        : businessType === 'salon'
                        ? 'مثال: صالون لورين للتجميل والعناية'
                        : businessType === 'restaurant'
                        ? 'مثال: مطعم السرايا للمأكولات'
                        : businessType === 'events'
                        ? 'مثال: معرض الرياض للإبداع'
                        : businessType === 'entertainment'
                        ? 'مثال: صالة أدفنتشر للألعاب'
                        : businessType === 'cafe'
                        ? 'مثال: محمصة صويل المختصة'
                        : 'مثال: استوديو الذكريات'
                    }
                    className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  معرف الرابط المخصص للعملاء (Custom Slug) <span className="text-amber-600">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200 px-3.5 py-3 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition">
                  <span className="text-xs font-mono font-bold text-stone-400 select-none ltr">
                    memories.dev/c/
                  </span>
                  <input
                    type="text"
                    value={cafeSlug}
                    onChange={(e) => setCafeSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="my-business"
                    className="w-full bg-transparent text-stone-900 font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  هذا هو الرابط الفريد الذي سيفتحه عملاؤك عند مسح الـ QR على الطاولة أو الكاونتر
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  <strong>ملاءمة تامة لنشاطك:</strong> سيتعرف النظام تلقائياً على أنك ({currentProfile.nameAr})، ويخصص مسميات طاقم الخدمة ({currentProfile.staffLabel}) ونوع الهدايا والبطاقات بما يتناسق مع زوارك.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!cafeName.trim() || !cafeSlug.trim()}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <span>التالي: نظام الكارت والمكافأة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Card Type & Rewards */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2.5">
                  نوع الكارت المعتمد للزوار (Authoritative Card Style)
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
                  عدد الزيارات المطلوبة لفتح الهدية (Shot / Visits Goal)
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setShotCount(count)}
                      className={`py-3 rounded-2xl border font-bold text-sm transition cursor-pointer flex flex-col items-center justify-center ${
                        shotCount === count
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-base font-black">{count}</span>
                      <span className="text-[10px] opacity-80">زيارات</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Gift Offer Input */}
              <div className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-700" />
                    <span>عنوان الهدية أو المكافأة عند إكمال الأختام</span>
                  </label>
                  <input
                    type="text"
                    value={giftTitle}
                    onChange={(e) => setGiftTitle(e.target.value)}
                    placeholder={currentProfile.defaultGiftTitle}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    وصف وشروط استلام الهدية
                  </label>
                  <input
                    type="text"
                    value={giftSubtitle}
                    onChange={(e) => setGiftSubtitle(e.target.value)}
                    placeholder={currentProfile.defaultGiftSubtitle}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndLaunch}
                  className="px-7 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتوليد QR الطاولات فوراً</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Complete & Ready to Print */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-stone-950">
                  تم إعداد وتفعيل {cafeName} بنجاح!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  منظومة الذكريات والولاء جاهزة فوراً لنشاطك التجاري. اطبع كود الطاولات أو الكاونتر، أو شارك الرابط المباشر مع أول عميل يدخل المكان.
                </p>
              </div>

              {/* Acrylic Stand Preview Card */}
              <div className="max-w-xs mx-auto p-5 rounded-3xl bg-white border border-stone-300 shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-700 font-bold uppercase block">
                    TABLE SCAN STAND • {currentProfile.nameAr}
                  </span>
                  <h4 className="font-serif font-black text-base text-stone-900">
                    {cafeName}
                  </h4>
                </div>

                {qrDataUrl && (
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-stone-200 shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <span className="text-xs font-bold text-stone-900 block">امسح الكود بكاميرا هاتفك</span>
                  <span className="text-[10px] text-stone-500 block">وثّق زيارتك واستلم {giftTitle}</span>
                </div>
              </div>

              {/* Copy URL */}
              <div className="flex items-center gap-2 max-w-md mx-auto bg-stone-50 border border-stone-200 p-2 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={customerUrl}
                  className="w-full bg-transparent text-xs font-mono text-stone-700 px-2 outline-none ltr"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-xs font-bold text-stone-800 transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل كود QR عالي الدقة</span>
                </button>

                <a
                  href={customerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح تجربة العميل الحية</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  إغلاق والعودة للوحة التحكم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
