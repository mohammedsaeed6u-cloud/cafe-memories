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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#141212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-6 text-right text-[#e6e1e1]">
        {/* Header */}
        <div className="bg-[#1C1B1B] text-[#FBF9F5] p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-lg text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#141212] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">إعداد نشاطك التجاري في 60 ثانية</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#55100D]/70 text-[#FBF9F5] font-bold border border-[#DD0200]/40 font-mono">
                  إطلاق فوري
                </span>
              </div>
              <p className="text-xs text-[#A19E9B] mt-0.5 font-sans">
                حدد نوع نشاطك التجاري، اسم علامتك، وشكل الكارت، واستلم الـ QR فوراً
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-[11px] font-bold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#DD0200]' : 'text-[#A19E9B]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#DD0200] text-[#FBF9F5] font-bold' : 'bg-[#0B0A0A] border border-white/10 text-[#A19E9B]'}`}>
                1
              </span>
              <span>نوع النشاط والهوية</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#DD0200]' : 'text-[#A19E9B]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#DD0200] text-[#FBF9F5] font-bold' : 'bg-[#0B0A0A] border border-white/10 text-[#A19E9B]'}`}>
                2
              </span>
              <span>نظام الكارت والمكافأة</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#DD0200]' : 'text-[#A19E9B]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-[#DD0200] text-[#FBF9F5] font-bold' : 'bg-[#0B0A0A] border border-white/10 text-[#A19E9B]'}`}>
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
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  اختر نوع النشاط التجاري (Industry Type) <span className="text-[#DD0200]">*</span>
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
                            ? 'bg-[#55100D]/40 border-[#DD0200] text-[#FBF9F5] shadow-[0_0_15px_-3px_rgba(221,2,0,0.25)] font-bold'
                            : 'bg-[#1C1B1B] hover:bg-[#211F1F] border-white/10 text-[#A19E9B] hover:text-[#FBF9F5]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#DD0200]' : 'text-[#A19E9B]'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#DD0200] stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold block text-[#FBF9F5]">{opt.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  اسم المنشأة أو العلامة التجارية <span className="text-[#DD0200]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#A19E9B]/50">
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
                    className="w-full pr-11 pl-4 py-3 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#FBF9F5] font-bold text-sm focus:outline-none focus:border-[#DD0200] transition placeholder:text-[#A19E9B]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  معرف الرابط المخصص للعملاء (Custom Slug) <span className="text-[#DD0200]">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-[#0B0A0A] border border-white/10 px-3.5 py-2.5 focus-within:border-[#DD0200] transition">
                  <span className="text-xs font-mono font-bold text-[#A19E9B] select-none ltr">
                    memories.dev/c/
                  </span>
                  <input
                    type="text"
                    value={cafeSlug}
                    onChange={(e) => setCafeSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="my-business"
                    className="w-full bg-transparent text-[#FBF9F5] font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#A19E9B] mt-1.5">
                  هذا هو الرابط الفريد الذي سيفتحه عملاؤك عند مسح الـ QR على الطاولة أو الكاونتر
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#DD0200] shrink-0 mt-0.5" />
                <p className="text-xs text-[#e6e1e1] leading-relaxed font-medium">
                  <strong className="text-[#FBF9F5]">ملاءمة تامة لنشاطك:</strong> سيتعرف النظام تلقائياً على أنك ({currentProfile.nameAr})، ويخصص مسميات طاقم الخدمة ({currentProfile.staffLabel}) ونوع الهدايا والبطاقات بما يتناسق مع زوارك.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!cafeName.trim() || !cafeSlug.trim()}
                  className="px-6 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-40 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
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
                <label className="block text-xs font-bold text-[#A19E9B] mb-2.5">
                  نوع الكارت المعتمد للزوار (Authoritative Card Style)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setOrientation('vertical')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      orientation === 'vertical'
                        ? 'border-[#DD0200] bg-[#55100D]/30 shadow-md text-[#FBF9F5]'
                        : 'border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center font-bold">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#FBF9F5]">كارت طولي (Photo Strip)</h4>
                          <span className="text-[10px] text-[#DD0200] font-bold font-mono">النمط الكوري الكلاسيكي</span>
                        </div>
                      </div>
                      {orientation === 'vertical' && (
                        <CheckCircle2 className="w-5 h-5 text-[#DD0200] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#A19E9B] mt-2.5 leading-relaxed">
                      شريط صور عمودي (Photo Booth) مثالي للمشاركة على ستوري إنستغرام وتيك توك وللطباعة الورقية الفورية.
                    </p>
                  </div>

                  <div
                    onClick={() => setOrientation('horizontal')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      orientation === 'horizontal'
                        ? 'border-[#DD0200] bg-[#55100D]/30 shadow-md text-[#FBF9F5]'
                        : 'border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1C1B1B] border border-white/10 text-[#FBF9F5] flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4 text-[#DD0200]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#FBF9F5]">كارت أفقي (Digital Wallet Pass)</h4>
                          <span className="text-[10px] text-[#A19E9B] font-bold font-mono">نمط بطاقة محفظة آبل</span>
                        </div>
                      </div>
                      {orientation === 'horizontal' && (
                        <CheckCircle2 className="w-5 h-5 text-[#DD0200] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#A19E9B] mt-2.5 leading-relaxed">
                      بطاقة رقمية فخمة بنمط المحفظة الرقمية، مريحة للنظر وتظهر جميع أختام الزيارات في صف أفقي واحد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Number of Visits */}
              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  عدد الزيارات المطلوبة لفتح الهدية (Shot / Visits Goal)
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setShotCount(count)}
                      className={`py-3 rounded-lg border font-bold text-sm transition cursor-pointer flex flex-col items-center justify-center ${
                        shotCount === count
                          ? 'border-[#DD0200] bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:bg-[#211F1F] hover:text-[#FBF9F5]'
                      }`}
                    >
                      <span className="text-base font-bold font-mono">{count}</span>
                      <span className="text-[10px] opacity-80">زيارات</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Gift Offer Input */}
              <div className="space-y-3 p-4 rounded-xl bg-[#1C1B1B] border border-white/10">
                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1.5 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#DD0200]" />
                    <span>عنوان الهدية أو المكافأة عند إكمال الأختام</span>
                  </label>
                  <input
                    type="text"
                    value={giftTitle}
                    onChange={(e) => setGiftTitle(e.target.value)}
                    placeholder={currentProfile.defaultGiftTitle}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#FBF9F5] font-bold text-xs focus:outline-none focus:border-[#DD0200] placeholder:text-[#A19E9B]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                    وصف وشروط استلام الهدية
                  </label>
                  <input
                    type="text"
                    value={giftSubtitle}
                    onChange={(e) => setGiftSubtitle(e.target.value)}
                    placeholder={currentProfile.defaultGiftSubtitle}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#FBF9F5] text-xs focus:outline-none focus:border-[#DD0200] placeholder:text-[#A19E9B]/40"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-lg border border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5] font-bold text-xs hover:bg-[#211F1F] transition cursor-pointer"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndLaunch}
                  className="px-6 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm flex items-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
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
              <div className="w-16 h-16 rounded-full bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif text-[#FBF9F5]">
                  تم إعداد وتفعيل {cafeName} بنجاح!
                </h3>
                <p className="text-xs text-[#A19E9B] mt-1 max-w-md mx-auto leading-relaxed">
                  منظومة الذكريات والولاء جاهزة فوراً لنشاطك التجاري. اطبع كود الطاولات أو الكاونتر، أو شارك الرابط المباشر مع أول عميل يدخل المكان.
                </p>
              </div>

              {/* Acrylic Stand Preview Card */}
              <div className="max-w-xs mx-auto p-5 rounded-2xl bg-[#1C1B1B] border border-white/10 shadow-2xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#DD0200] font-bold uppercase block">
                    TABLE SCAN STAND • {currentProfile.nameAr}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#FBF9F5]">
                    {cafeName}
                  </h4>
                </div>

                {qrDataUrl && (
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl border border-white/20 shadow-md flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <span className="text-xs font-bold text-[#FBF9F5] block">امسح الكود بكاميرا هاتفك</span>
                  <span className="text-[10px] text-[#A19E9B] block">وثّق زيارتك واستلم {giftTitle}</span>
                </div>
              </div>

              {/* Copy URL */}
              <div className="flex items-center gap-2 max-w-md mx-auto bg-[#0B0A0A] border border-white/10 p-2 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={customerUrl}
                  className="w-full bg-transparent text-xs font-mono text-[#FBF9F5] px-2 outline-none ltr"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1C1B1B] border border-white/10 hover:bg-[#211F1F] text-xs font-bold text-[#FBF9F5] transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-5 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#A19E9B]" />
                  <span>تحميل كود QR عالي الدقة</span>
                </button>

                <a
                  href={customerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح تجربة العميل الحية</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] font-bold text-xs transition cursor-pointer"
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
