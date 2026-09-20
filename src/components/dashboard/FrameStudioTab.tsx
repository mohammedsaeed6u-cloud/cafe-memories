'use client';

import React, { useState } from 'react';
import { BusinessSettings, PhotoboothFrame, ShotCount, StripOrientation } from '@/types/photobooth';
import { PRESET_EMOJI_PAIRS } from '@/lib/constants/photobooth-presets';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import {
  Sparkles,
  Upload,
  Check,
  Palette,
  Camera,
  Layout,
  Gift,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

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

  // Sample photos for preview in studio
  const samplePhotos = [
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
  ].slice(0, activeFrame.shotCount);

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

  // Handle Shot Count Change
  const handleShotCountChange = (count: ShotCount) => {
    setActiveFrame((prev) => ({ ...prev, shotCount: count }));
  };

  // Handle Orientation Change
  const handleOrientationChange = (orientation: StripOrientation) => {
    setActiveFrame((prev) => ({ ...prev, orientation }));
  };

  // Handle Corner Emojis Preset Pick
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
      {/* Left Column: Controls & Studio Studio Customizer (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Section 1: Business Branding & Logo */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              هوية ولوجو البيزنس / الكافيه
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                اسم المكان المطبوع على الشريط
              </label>
              <input
                type="text"
                value={branding.name}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="مثلاً: إكسبرسو لاب • Memories"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                لوجو البيزنس (يظهر أعلى شريط الصور)
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

        {/* Section 2: Shot Count & Orientation */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              توجيه الشريط وعدد اللقطات
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shot Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>كم صورة في الشريط؟</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as ShotCount[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => handleShotCountChange(count)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      activeFrame.shotCount === count
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {count} {count === 1 ? 'لقطة' : 'لقطات'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-amber-600" />
                <span>شكل وتوجيه الشريط</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOrientationChange('vertical')}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    activeFrame.orientation === 'vertical'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>رأسي كلاسيكي (Strip)</span>
                </button>
                <button
                  onClick={() => handleOrientationChange('horizontal')}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    activeFrame.orientation === 'horizontal'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>أفقي شبكي (Postcard)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Corner Stickers / Emojis (Photobooth Signature) */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-extrabold text-stone-900 text-base">
                ستيكرز وإيموجي الزوايا (Corner Emojis)
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

          <p className="text-xs text-stone-500 mb-3">
            توضع تلقائياً على زاوية أعلى اليمين وزاوية أسفل اليسار لمحاكاة كبائن التصوير الكورية واليابانية الشهيرة:
          </p>

          {/* Preset emoji pairs */}
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

          {/* Custom Emojis input */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                إيموجي أعلى اليمين (Top-Right):
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
                إيموجي أسفل اليسار (Bottom-Left):
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

        {/* Section 4: Frame Colors & Themes */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              ألوان وخامات الإطار
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                لون الورق (الخلفية)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeFrame.bgColor}
                  onChange={(e) => setActiveFrame({ ...activeFrame, bgColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300"
                />
                <span className="text-xs font-mono">{activeFrame.bgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                لون الحدود
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeFrame.borderColor}
                  onChange={(e) => setActiveFrame({ ...activeFrame, borderColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300"
                />
                <span className="text-xs font-mono">{activeFrame.borderColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                لون النصوص
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeFrame.textColor}
                  onChange={(e) => setActiveFrame({ ...activeFrame, textColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300"
                />
                <span className="text-xs font-mono">{activeFrame.textColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Free Gift Offer Manager */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              5
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              الهدية الفورية المطبوعة مع الشريط للعميل
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                عنوان العرض / الهدية
              </label>
              <input
                type="text"
                value={freeGift.title}
                onChange={(e) => setFreeGift({ ...freeGift, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="مثلاً: مشروب مجاني ترحيبي أو خصم 20%"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                شرح الاستلام للعميل
              </label>
              <input
                type="text"
                value={freeGift.subtitle}
                onChange={(e) => setFreeGift({ ...freeGift, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="أظهر هذا الشريط للباريستا للاستلام فوراً"
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
            <span>حفظ الإعدادات وتطبيقها فوراً على شاشات الزوار</span>
          </button>

          {isSavedNotice && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ كافة إعدادات الإطار واللوجو وتحديثها للعملاء بنجاح!</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Interactive Photobooth Strip Preview (5 cols) */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="p-6 bg-gradient-to-b from-[#F5F2EB] to-[#FAF8F5] rounded-3xl border border-stone-200 shadow-md flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <span className="text-xs font-black tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>معاينة حية فورية لشريط الصور</span>
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {activeFrame.orientation === 'horizontal' ? 'أفقي' : 'رأسي'} • {activeFrame.shotCount} صور
            </span>
          </div>

          {/* Interactive Card */}
          <PhotoboothStripCard
            photos={samplePhotos}
            frame={activeFrame}
            branding={branding}
            giftCode="GIFT-PREVIEW"
            onPrint={() => window.print()}
          />

          <p className="text-[11px] text-stone-500 mt-4 text-center font-medium">
            هذا هو الشكل الدقيق الذي سيظهر على هواتف عملائك وعند طباعة الشريط الورقي 2x6
          </p>
        </div>
      </div>
    </div>
  );
};
