'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Palette,
  Sparkles,
  Sliders,
  Check,
  Upload,
  Trash2,
  Gift,
  Award,
  Store,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import { BusinessSettings, WalletColorPreset } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { CURATED_CARD_PRESETS, CardImageService } from '@/lib/services/card-image.service';

interface Props {
  cafeSlug: string;
  currentSettings: BusinessSettings;
  isOpen: boolean;
  onToggle: () => void;
  onSettingsSaved?: (updated: BusinessSettings) => void;
  simulatedStamps: number;
  onSimulatedStampsChange: (val: number) => void;
}

const LUXURY_COLOR_PRESETS = [
  { id: 'dark', label: 'داكن فاخر (Obsidian)', hex: '#161618', ring: 'ring-stone-400' },
  { id: 'latte', label: 'كافيه دافئ (Espresso)', hex: '#2A1E17', ring: 'ring-amber-500' },
  { id: 'blue', label: 'كحلي ملكي (Navy)', hex: '#0F172A', ring: 'ring-blue-400' },
  { id: 'green', label: 'زمردي راقٍ (Emerald)', hex: '#064E3B', ring: 'ring-emerald-400' },
  { id: 'burgundy', label: 'عنابي مخملي (Burgundy)', hex: '#4C0519', ring: 'ring-rose-400' },
  { id: 'purple', label: 'بنفسجي إمبراطوري (Violet)', hex: '#3B0764', ring: 'ring-purple-400' },
];

const STAMP_ICON_OPTIONS = [
  { emoji: '☕', label: 'قهوة' },
  { emoji: '⭐', label: 'نجمة' },
  { emoji: '📸', label: 'كاميرا' },
  { emoji: '👑', label: 'تاج' },
  { emoji: '🎁', label: 'هدية' },
  { emoji: '🥐', label: 'مخبوزات' },
  { emoji: '🍕', label: 'بيتزا' },
  { emoji: '🍔', label: 'برجر' },
  { emoji: '💇', label: 'صالون' },
  { emoji: '💎', label: 'ألماسة' },
];

const SLOT_COUNT_OPTIONS = [4, 5, 6, 8, 10];

export const MerchantCardCustomizerDrawer: React.FC<Props> = ({
  cafeSlug,
  currentSettings,
  isOpen,
  onToggle,
  onSettingsSaved,
  simulatedStamps,
  onSimulatedStampsChange,
}) => {
  const [colorHex, setColorHex] = useState(
    currentSettings.walletPassConfig?.colorHex || '#161618'
  );
  const [maxSlots, setMaxSlots] = useState(
    currentSettings.loyaltyMaxVisits || 5
  );
  const [stampEmoji, setStampEmoji] = useState(
    currentSettings.stampConfig?.customEmoji || '☕'
  );
  const [giftTitle, setGiftTitle] = useState(
    currentSettings.freeGiftOffer?.title || 'هدية الزيارة أو خصم ترحيبي'
  );
  const [brandName, setBrandName] = useState(
    currentSettings.branding?.name || 'Stampy'
  );
  const [logoUrl, setLogoUrl] = useState<string | undefined>(
    currentSettings.branding?.logoUrl
  );
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [cardBackgroundUrl, setCardBackgroundUrl] = useState<string | undefined>(
    currentSettings.walletPassConfig?.cardBackgroundUrl
  );
  const [cardOverlayOpacity, setCardOverlayOpacity] = useState(
    currentSettings.walletPassConfig?.cardOverlayOpacity ?? 0.65
  );
  const [cardPresetId, setCardPresetId] = useState<string | undefined>(
    currentSettings.walletPassConfig?.cardBackgroundPresetId
  );

  const [isPushingUpdate, setIsPushingUpdate] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLogoUploading(true);
    try {
      const result = await CardImageService.compressAndCropImage(file, {
        targetWidth: 200,
        targetHeight: 200,
        quality: 0.9,
      });
      setLogoUrl(result.dataUrl);
    } catch (err: any) {
      alert(err?.message || 'تعذر معالجة شعار المتجر');
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleBroadcastPassUpdate = async () => {
    setIsPushingUpdate(true);
    setPushResult(null);
    try {
      const res = await DigitalWalletService.broadcastBulkCardUpdate({
        cafeSlug,
        pushMessage: `✨ تم تحديث كارت ولاء ${brandName} وإضافة خانات الأختام والمكافآت الجديدة! ☕🎁`,
        colorHex,
        stampIcon: stampEmoji,
        giftTitle,
        cafeName: brandName,
        logoUrl: logoUrl || currentSettings.branding?.logoUrl,
        cardBackgroundUrl: cardBackgroundUrl || currentSettings.walletPassConfig?.cardBackgroundUrl,
      });

      setPushResult({
        success: true,
        message: res.sentCount > 0 
          ? `✓ تم بث وتحديث ${res.sentCount} كارت بنجاح، وإرسال إشعار الدفع لـ ${res.notifiedDevices} جهاز نشط!`
          : `✓ تم إرسال طلب التحديث لمنظومة Apple & Google Wallet السحابية بنجاح لجميع الكروت!`,
      });
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err?.message || 'تعذر إرسال التحديث للكروت المربوطة',
      });
    } finally {
      setIsPushingUpdate(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await CardImageService.compressAndCropImage(file, {
        targetWidth: 690,
        targetHeight: 1010,
        quality: 0.85,
      });
      setCardBackgroundUrl(result.dataUrl);
      setCardPresetId(undefined);
    } catch (err: any) {
      alert(err?.message || 'تعذر معالجة الصورة، يرجى اختيار صورة أخرى');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToStore = () => {
    const updatedSettings: BusinessSettings = {
      ...currentSettings,
      loyaltyMaxVisits: maxSlots,
      freeGiftOffer: {
        ...currentSettings.freeGiftOffer,
        title: giftTitle,
      },
      branding: {
        ...currentSettings.branding,
        name: brandName,
        logoUrl: logoUrl !== undefined ? logoUrl : currentSettings.branding?.logoUrl,
      },
      stampConfig: {
        ...currentSettings.stampConfig,
        type: 'emoji',
        customEmoji: stampEmoji,
      },
      walletPassConfig: {
        ...currentSettings.walletPassConfig,
        colorHex,
        cardBackgroundUrl,
        cardOverlayOpacity,
        cardBackgroundPresetId: cardPresetId,
      },
    };

    BusinessSettingsService.saveSettings(updatedSettings);

    if (onSettingsSaved) {
      onSettingsSaved(updatedSettings);
    }

    // Asynchronous Cloud Sync with Supabase organizations table
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        supabase
          .from('organizations')
          .update({
            name: brandName,
            primary_color: colorHex,
            logo_url: logoUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('slug', cafeSlug)
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase org sync notice:', error.message);
            },
            (err) => console.warn('Supabase org sync error:', err)
          );
      }).catch((err) => console.warn('Dynamic supabase import error:', err));
    }

    // Automatically synchronize live Apple/Google Wallet passes in background
    DigitalWalletService.broadcastBulkCardUpdate({
      cafeSlug,
      pushMessage: `✨ تم تحديث تصميم كارت ولاء ${brandName}! ☕🎁`,
      colorHex,
      stampIcon: stampEmoji,
      giftTitle,
      cafeName: brandName,
      logoUrl: logoUrl !== undefined ? logoUrl : currentSettings.branding?.logoUrl,
      cardBackgroundUrl,
    }).catch((e) => console.warn('Background wallet pass update note:', e));

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto mb-4">
      {/* Launch / Toggle Ribbon */}
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-orange-500/10 border border-amber-500/30 rounded-2xl p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#c92a54] text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <span>تخصيص الكارت كصاحب متجر</span>
              <span className="text-[10px] bg-[#c92a54] text-white px-2 py-0.5 rounded-full font-bold">
                تحكم كامل
              </span>
            </h3>
            <p className="text-[10px] text-amber-900/80">
              غيّر الألوان، عدد الأختام، والشكل المعتمد بمزاجك فورياً
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="px-3.5 py-1.5 rounded-xl bg-[#FBF9F5] hover:bg-[#382D27] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
        >
          {isOpen ? 'إغلاق اللوحة ✕' : 'تعديل التصميم 🎨'}
        </button>
      </div>

      {/* Expandable Customization Panel */}
      {isOpen && (
        <div className="mt-3 p-5 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-lg space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)]/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c92a54]" />
              <span className="text-xs font-black text-[#FBF9F5]">
                لوحة إعدادات وتخصيص الكارت لصاحب المتجر
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">
              كود المتجر: {cafeSlug}
            </span>
          </div>

          {/* 1. Card Luxury Color Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#FBF9F5]">
              🎨 لون وثيم الكارت الأساسي:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LUXURY_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setColorHex(preset.hex)}
                  className={`p-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-2xs ${
                    colorHex.toLowerCase() === preset.hex.toLowerCase()
                      ? 'ring-2 ring-[#c92a54] ring-offset-1 scale-[1.02]'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {colorHex.toLowerCase() === preset.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{preset.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.1)] cursor-pointer"
              />
              <input
                type="text"
                dir="ltr"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-28 px-3 py-1.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] font-mono font-bold uppercase focus:border-[#c92a54] focus:outline-none"
                placeholder="#161618"
              />
              <span className="text-[11px] text-stone-500">لون مخصص بالكامل</span>
            </div>
          </div>

          {/* 2. Number of Stamp Slots */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#FBF9F5]">
              🔢 عدد الأختام المطلوبة للحصول على الهدية:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SLOT_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxSlots(count)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    maxSlots === count
                      ? 'bg-[#c92a54] text-white border-[#c92a54] shadow-xs'
                      : 'bg-[#0B0A0A] text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {count} أختام
                </button>
              ))}
            </div>
          </div>

          {/* 3. Stamp Emoji & Icon */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#FBF9F5]">
              🏷️ شكل وأيقونة الختم:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STAMP_ICON_OPTIONS.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setStampEmoji(item.emoji)}
                  className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    stampEmoji === item.emoji
                      ? 'bg-amber-50 text-amber-950 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                      : 'bg-[#0B0A0A] text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Reward Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#FBF9F5]">
              🎁 عنوان ومكافأة الكارت:
            </label>
            <input
              type="text"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              placeholder="مثال: مشروبك المفضل مجاناً عند اكتمال الكارت"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none font-bold"
            />
          </div>

          {/* 5. Brand Store Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#FBF9F5]">
              ✨ اسم المنشأة أو العلامة التجارية:
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="اسم المتجر"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none font-bold"
            />
          </div>

          {/* 5b. Business Brand Logo (لوجو المتجر لظهوره في الكارت وإشعارات شاشة القفل) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#FBF9F5]">
                🏷️ شعار / لوجو المتجر (يظهر في الكارت وإشعارات القفل):
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(undefined)}
                  className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>إزالة الشعار</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xs shrink-0 bg-stone-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.1)] bg-[#141212] flex items-center justify-center text-stone-400 shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#FBF9F5] text-xs font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-[#c92a54]" />
                  <span>{isLogoUploading ? 'جارٍ المعالجة...' : 'رفع صورة الشعار'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isLogoUploading}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  value={logoUrl || ''}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="أو ضع رابط صورة الشعار مباشرة (URL)"
                  className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. Card Background Presets & Custom Upload */}
          <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.1)]/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#FBF9F5]">
                🖼️ خلفية الكارت الفاخرة (اختياري):
              </label>
              {cardBackgroundUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCardBackgroundUrl(undefined);
                    setCardPresetId(undefined);
                  }}
                  className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>إزالة الخلفية</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {CURATED_CARD_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setCardPresetId(preset.id);
                    setCardBackgroundUrl(preset.backgroundUrl);
                    setCardOverlayOpacity(preset.recommendedOverlayOpacity);
                  }}
                  className={`p-1.5 rounded-xl border text-center transition cursor-pointer relative overflow-hidden ${
                    cardPresetId === preset.id
                      ? 'border-[#c92a54] ring-2 ring-amber-500 shadow-2xs'
                      : 'border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A]'
                  }`}
                >
                  <div
                    className="w-full h-10 rounded-lg mb-1 bg-cover bg-center border border-stone-200"
                    style={{ backgroundImage: `url(${preset.thumbnailUrl})` }}
                  />
                  <span className="text-[10px] font-bold text-stone-800 block truncate">
                    {preset.nameAr.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Upload */}
            <div className="pt-1 flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border border-stone-300">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                <span>{isUploading ? 'جاري الرفع...' : 'رفع صورة خاصة للبراند'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {cardBackgroundUrl && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  تم تعيين صورة
                </span>
              )}
            </div>

            {/* Opacity Slider */}
            {cardBackgroundUrl && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-stone-700">تظليل الصورة لبروز الأختام:</span>
                  <span className="font-mono text-[#c92a54]">{Math.round(cardOverlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={cardOverlayOpacity}
                  onChange={(e) => setCardOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#c92a54] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 7. Interactive Stamp Simulator */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <span className="text-[11px] font-black text-amber-950 block">
              🧪 تجربة ومحاكاة شكل الكارت المباشر:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '0 أختام', val: 0 },
                { label: '1 ختم', val: 1 },
                { label: `${Math.floor(maxSlots / 2)} أختام`, val: Math.floor(maxSlots / 2) },
                { label: 'مكتمل 🎉', val: maxSlots },
              ].map((sim) => (
                <button
                  key={sim.label}
                  type="button"
                  onClick={() => onSimulatedStampsChange(sim.val)}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                    simulatedStamps === sim.val
                      ? 'bg-[#c92a54] text-white border-[#c92a54] shadow-2xs'
                      : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {sim.label}
                </button>
              ))}
            </div>
          </div>


            {/* Push Update to Linked Passes Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isPushingUpdate}
                onClick={handleBroadcastPassUpdate}
                className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {isPushingUpdate
                    ? 'جاري إرسال وبث التحديث لـ Apple & Google Wallet...'
                    : '📲 إرسال وبث التحديث لجميع الكروت المربوطة (Apple & Google APNs)'}
                </span>
              </button>

              {pushResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs font-bold text-center animate-in fade-in border ${
                    pushResult.success
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {pushResult.message}
                </div>
              )}
            </div>

          {/* 8. Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveToStore}
              className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>💾 حفظ التصميم الجديد وتطبيقه لجميع زوار المتجر فورياً</span>
            </button>

            {saveSuccess && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold text-center animate-in fade-in">
                ✓ تم حفظ إعدادات المتجر وتطبيقها بنجاح! تظهر الآن فوراً لجميع الزوار.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
