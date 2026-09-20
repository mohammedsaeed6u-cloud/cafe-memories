'use client';

import React, { useState } from 'react';
import { BusinessSettings, PhotoboothFrame, StripOrientation } from '@/types/photobooth';
import { PRESET_EMOJI_PAIRS } from '@/lib/constants/photobooth-presets';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import {
  Sparkles,
  Upload,
  Check,
  Camera,
  Layout,
  Gift,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { PrintService } from '@/lib/services/print.service';

interface FrameStudioTabProps {
  settings: BusinessSettings;
  onSettingsUpdated: (newSettings: BusinessSettings) => void;
}

export const FrameStudioTab: React.FC<FrameStudioTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [activeFrame, setActiveFrame] = useState<PhotoboothFrame>(() => {
    return (
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0]
    );
  });

  const [branding, setBranding] = useState(settings.branding);
  const [freeGift, setFreeGift] = useState(settings.freeGiftOffer);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Sample photos for preview in studio (simulates a customer who completed 2 visits)
  const samplePhotos = [
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  ].slice(0, Math.max((activeFrame.shotCount || 3) - 1, 1));

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBranding((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // Free number of photos in the card
  const handleShotCountChange = (count: number) => {
    const valid = Math.max(Number(count) || 1, 1);
    setActiveFrame((prev) => ({ ...prev, shotCount: valid }));
  };

  // Orientation Change
  const handleOrientationChange = (orientation: StripOrientation) => {
    setActiveFrame((prev) => ({ ...prev, orientation }));
  };

  // Corner Emojis Preset Pick
  const handleSelectEmojiPair = (topRight: string, bottomLeft: string) => {
    setActiveFrame((prev) => ({
      ...prev,
      cornerEmojis: {
        ...prev.cornerEmojis,
        topRight,
        bottomLeft,
        enabled: true,
      },
    }));
  };

  // Save All Settings
  const handleSaveAll = () => {
    const updatedFrames = settings.frames.map((f) =>
      f.id === activeFrame.id ? activeFrame : f
    );
    if (!updatedFrames.some((f) => f.id === activeFrame.id)) {
      updatedFrames.push(activeFrame);
    }

    const updatedSettings: BusinessSettings = {
      ...settings,
      branding,
      freeGiftOffer: freeGift,
      activeFrameId: activeFrame.id,
      defaultShotCount: activeFrame.shotCount,
      defaultOrientation: activeFrame.orientation,
      frames: updatedFrames,
    };

    BusinessSettingsService.saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Controls (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Section 1: Business Branding & Logo */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              هوية ولوجو البيزنس
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                اسم المكان في ترويسة الكارت
              </label>
              <input
                type="text"
                value={branding.name}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="مثلاً: Memories Studio"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                لوجو المكان
              </label>
              <div className="flex items-center gap-4">
                {branding.logoUrl ? (
                  <div className="relative w-20 h-14 rounded-xl border-2 border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={branding.logoUrl}
                      alt="Business Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[9px]">بدون لوجو</span>
                  </div>
                )}

                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 flex items-center gap-2 transition">
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>{branding.logoUrl ? 'تغيير اللوجو' : 'رفع لوجو المكان'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {branding.logoUrl && (
                  <button
                    onClick={() => setBranding({ ...branding, logoUrl: '' })}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    حذف اللوجو
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Free Number of Photos in Card & Orientation */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              تحديد خانات كارت الولاء وتوجيهه
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Number of Photos Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>اكتب عدد الصور في كارت العميل:</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={activeFrame.shotCount || 3}
                  onChange={(e) => handleShotCountChange(parseInt(e.target.value) || 1)}
                  className="w-24 text-center font-mono font-black text-xl py-2 px-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-xs text-stone-500 font-medium">
                  صور (صورة واحدة لكل زيارة، والهدية في الخانة الأخيرة)
                </span>
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-amber-600" />
                <span>شكل الكارت</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOrientationChange('vertical')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    activeFrame.orientation === 'vertical'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  رأسي (شريط 2x6)
                </button>
                <button
                  onClick={() => handleOrientationChange('horizontal')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    activeFrame.orientation === 'horizontal'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  أفقي (كارت بريدي)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Reward on the Last Slot */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              هدية وجائزة الخانة الأخيرة في الكارت
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                اسم الهدية (تظهر داخل الخانة الأخيرة في شريط العميل)
              </label>
              <input
                type="text"
                value={freeGift.title}
                onChange={(e) => setFreeGift({ ...freeGift, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="مثلاً: مشروب مجاني مميز + طباعة الكارت 2x6"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                شرح الاستلام للباريستا
              </label>
              <input
                type="text"
                value={freeGift.subtitle}
                onChange={(e) => setFreeGift({ ...freeGift, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="يظهر للباريستا لتسليم المشروب وطباعة الشريط الورقي"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Corner Emojis & Colors */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-extrabold text-stone-900 text-base">
                ستيكرز الزوايا (Corner Emojis)
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={activeFrame.cornerEmojis?.enabled ?? true}
                onChange={(e) =>
                  setActiveFrame({
                    ...activeFrame,
                    cornerEmojis: {
                      ...activeFrame.cornerEmojis,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>تفعيل الستيكرز</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {PRESET_EMOJI_PAIRS.map((pair, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectEmojiPair(pair.topRight, pair.bottomLeft)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                  activeFrame.cornerEmojis?.topRight === pair.topRight &&
                  activeFrame.cornerEmojis?.bottomLeft === pair.bottomLeft
                    ? 'border-amber-500 bg-amber-50 font-bold'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{pair.label}</span>
                <span className="text-base">
                  {pair.bottomLeft} {pair.topRight}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                إيموجي أعلى اليمين:
              </label>
              <input
                type="text"
                value={activeFrame.cornerEmojis?.topRight || ''}
                onChange={(e) =>
                  setActiveFrame({
                    ...activeFrame,
                    cornerEmojis: {
                      ...activeFrame.cornerEmojis,
                      topRight: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                إيموجي أسفل اليسار:
              </label>
              <input
                type="text"
                value={activeFrame.cornerEmojis?.bottomLeft || ''}
                onChange={(e) =>
                  setActiveFrame({
                    ...activeFrame,
                    cornerEmojis: {
                      ...activeFrame.cornerEmojis,
                      bottomLeft: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-2">
          <button
            onClick={handleSaveAll}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white font-bold text-base shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border border-stone-700"
          >
            <Save className="w-5 h-5 text-amber-400" />
            <span>حفظ الإعدادات وتطبيقها فوراً على كروت العملاء</span>
          </button>

          {isSavedNotice && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ الإعدادات وعدد الخانات وجائزة الخانة الأخيرة بنجاح!</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Interactive Card Preview (5 cols) */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="p-6 bg-gradient-to-b from-[#F5F2EB] to-[#FAF8F5] rounded-3xl border border-stone-200 shadow-md flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <span className="text-xs font-black tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>معاينة كارت الولاء المصور</span>
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {activeFrame.shotCount} خانات
            </span>
          </div>

          {/* Card with Multi-Visit Slots & Last Slot Reward */}
          <PhotoboothStripCard
            photos={samplePhotos}
            frame={activeFrame}
            branding={branding}
            freeGiftOffer={freeGift}
            onPrint={() => PrintService.printElement('printable-strip')}
          />

          <p className="text-[11px] text-stone-500 mt-4 text-center font-medium">
            يملأ العميل صورة في كل زيارة، وتظهر هديته المحددة في الخانة الأخيرة لتحفيزه على إكمال الكارت
          </p>
        </div>
      </div>
    </div>
  );
};
