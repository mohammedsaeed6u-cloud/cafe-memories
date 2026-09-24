'use client';

import React, { useState } from 'react';
import {
  Building2,
  Store,
  Sparkles,
  Utensils,
  Scissors,
  ShoppingBag,
  PartyPopper,
  Coffee,
  Check,
  Save,
  CheckCircle,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { BusinessSettings, BusinessType } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { BUSINESS_INDUSTRY_OPTIONS, getIndustryProfile } from '@/lib/constants/photobooth-presets';

interface DashboardSettingsTabProps {
  settings: BusinessSettings;
  onSettingsUpdated: (updated: BusinessSettings) => void;
  onOpenQuickSetup: () => void;
}

export function DashboardSettingsTab({
  settings,
  onSettingsUpdated,
  onOpenQuickSetup,
}: DashboardSettingsTabProps) {
  const [businessType, setBusinessType] = useState<BusinessType>((settings.businessType as BusinessType) || 'general');
  const [businessName, setBusinessName] = useState(settings.branding?.name || 'استوديو الذكريات');
  const [tagline, setTagline] = useState(settings.branding?.tagline || 'SHARED MOMENTS & GUEST ENGAGEMENT STUDIO');
  const [logoUrl, setLogoUrl] = useState(settings.branding?.logoUrl || '');
  const [shotCount, setShotCount] = useState(settings.defaultShotCount || 5);
  const [giftTitle, setGiftTitle] = useState(settings.freeGiftOffer?.title || 'هدية ترحيبية خاصة');
  const [giftSubtitle, setGiftSubtitle] = useState(settings.freeGiftOffer?.subtitle || 'مكافأة حصرية للعميل عند إكمال الزيارات');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeIndustry = getIndustryProfile(businessType);

  const handleSelectIndustry = (typeId: BusinessType) => {
    setBusinessType(typeId);
    const profile = getIndustryProfile(typeId);
    // If the merchant hasn't heavily customized the gift title, suggest the industry preset
    if (!giftTitle || giftTitle === 'كوب قهوة مختصة مجاني' || giftTitle === 'هدية ترحيبية خاصة') {
      setGiftTitle(profile.defaultGiftTitle);
      setGiftSubtitle(profile.defaultGiftSubtitle);
    }
  };

  const handleSave = () => {
    const updated: BusinessSettings = {
      ...settings,
      businessType,
      branding: {
        ...settings.branding,
        name: businessName,
        tagline,
        logoUrl: logoUrl.trim() || undefined,
      },
      defaultShotCount: shotCount,
      loyaltyMaxVisits: shotCount,
      freeGiftOffer: {
        title: giftTitle,
        subtitle: giftSubtitle,
        icon: 'gift',
      },
    };

    BusinessSettingsService.saveSettings(updated);
    onSettingsUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h3 className="font-black text-base text-stone-900">
              إعدادات النشاط التجاري والهوية
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
              MULTI-INDUSTRY
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            خصص قطاع عملك، اسم علامتك التجارية، نمط المكافآت، ومسميات طاقم الخدمة.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickSetup}
          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          <span>معالج الإعداد السريع</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ الإعدادات وتطبيقها بنجاح عبر المنظومة ونقاط الخدمة!</span>
        </div>
      )}

      {/* 1. Industry Type Selector */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h4 className="font-bold text-sm text-stone-900">1. قطاع النشاط التجاري (Business Industry)</h4>
            <p className="text-xs text-stone-500">اختر القطاع ليتم ضبط مسميات طاقم الخدمة، ونوع الهدايا والبطاقات تلقائياً.</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            القطاع الحالي: {activeIndustry.nameAr}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BUSINESS_INDUSTRY_OPTIONS.map((ind) => {
            const isSelected = businessType === ind.id;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => handleSelectIndustry(ind.id as BusinessType)}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xl">
                    {ind.id === 'retail' && '🛍️'}
                    {ind.id === 'salon' && '💇‍♀️'}
                    {ind.id === 'restaurant' && '🍽️'}
                    {ind.id === 'events' && '🎪'}
                    {ind.id === 'entertainment' && '🎮'}
                    {ind.id === 'cafe' && '☕'}
                    {ind.id === 'general' && '🏢'}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                </div>
                <div>
                  <strong className="text-xs font-black block">{ind.nameAr}</strong>
                  <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{ind.staffLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Brand Identity */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-stone-900 pb-3 border-b border-stone-100">
          2. بيانات العلامة التجارية (Brand Information)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              اسم النشاط التجاري / الفرع:
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="مثال: بوتيك الأناقة / استوديو الذكريات"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              الشعار الإعلاني (Tagline):
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="مثال: ذكريات مميزة مع كل زيارة"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              رابط الشعار المباشر (Logo Image URL):
            </label>
            <input
              type="url"
              dir="ltr"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-mono"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              اختياري: يظهر الشعار أعلى كروت الفوتوبوث، شاشة الصالة الحية، وستاندات الـ QR.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Loyalty Gift & Visits */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-stone-900 pb-3 border-b border-stone-100">
          3. برنامج مكافآت الزيارات والولاء (Loyalty Offer)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عنوان الهدية المجانية:
            </label>
            <input
              type="text"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              placeholder="مثال: خصم 20% / جلسة عناية مجانية / مشروب فاخر"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عدد الزيارات المطلوبة لفتح الهدية:
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setShotCount(cnt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    shotCount === cnt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cnt} زيارات
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              تفاصيل وشروط الهدية:
            </label>
            <input
              type="text"
              value={giftSubtitle}
              onChange={(e) => setGiftSubtitle(e.target.value)}
              placeholder="مثال: يستحق العميل هذه المكافأة فور إكمال الخانات في نقطة الكاشير"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
            />
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق الإعدادات</span>
        </button>
      </div>
    </div>
  );
}
