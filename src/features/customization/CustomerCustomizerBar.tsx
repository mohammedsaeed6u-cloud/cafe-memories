'use client';

import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  User,
  Award,
  Check,
  X,
  SlidersHorizontal,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  CustomerThemeConfig,
  CUSTOMER_THEMES,
  STAMP_ICONS,
  CUSTOMER_BADGES,
  CustomerCustomizationData,
} from './customer-themes';
import { CURATED_CARD_PRESETS, CardImageService } from '@/lib/services/card-image.service';

export type { CustomerCustomizationData, CustomerThemeConfig };
export { CUSTOMER_THEMES, STAMP_ICONS, CUSTOMER_BADGES };

interface CustomerCustomizerBarProps {
  customization: CustomerCustomizationData;
  onChange: (updated: Partial<CustomerCustomizationData>) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const CustomerCustomizerBar: React.FC<CustomerCustomizerBarProps> = ({
  customization,
  onChange,
  isOpen,
  onToggle,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'identity' | 'stamp' | 'background'>('theme');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const activeTheme =
    CUSTOMER_THEMES.find((t) => t.id === customization.themeId) || CUSTOMER_THEMES[0];

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadNotice(null);
    try {
      const result = await CardImageService.compressAndCropImage(file, {
        targetWidth: 690,
        targetHeight: 1010,
        quality: 0.85,
      });
      await CardImageService.saveCustomImage(`cust_bg_${Date.now()}`, result.dataUrl);
      onChange({
        customBackgroundUrl: result.dataUrl,
        backgroundPresetId: undefined,
        overlayOpacity: customization.overlayOpacity ?? 0.65,
      });
      setUploadNotice(`تم ضغط وتحسين صورتك الفاخرة (${result.sizeKb} KB)`);
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'تعذر معالجة الصورة، يرجى اختيار صورة أخرى');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto transition-all duration-300 ${className}`}>
      {/* Floating Pill Launch Button */}
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onToggle();
          }}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-stone-50 border border-[#EADBCE] text-[#231C18] text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTheme.accentHex }} />
          <SlidersHorizontal className="w-3.5 h-3.5 text-stone-600 group-hover:rotate-45 transition-transform" />
          <span>تخصيص الكارت والذكريات</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
            {isOpen ? 'إغلاق ✕' : 'تعديل ✦'}
          </span>
        </button>
      </div>

      {/* Expanded Customizer Drawer */}
      {isOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FCFAF7] border border-[#EADBCE] shadow-[0_20px_50px_-10px_rgba(40,30,20,0.12)] text-[#231C18] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE] mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: activeTheme.accentHex }} />
              <h4 className="text-xs sm:text-sm font-bold text-[#231C18]">
                تخصيص الكارت والختم الذكي
              </h4>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="إغلاق التخصيص"
              className="p-1 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Tabs (4 Columns) */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#F5F0E8] border border-[#EADBCE] mb-4 text-[11px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab('theme');
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'theme'
                  ? 'bg-white text-[#231C18] shadow-xs border border-[#EADBCE]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>الألوان</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab('identity');
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'identity'
                  ? 'bg-white text-[#231C18] shadow-xs border border-[#EADBCE]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>الاسم</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab('stamp');
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'stamp'
                  ? 'bg-white text-[#231C18] shadow-xs border border-[#EADBCE]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>الختم</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab('background');
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'background'
                  ? 'bg-white text-[#231C18] shadow-xs border border-[#EADBCE]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>الخلفية</span>
            </button>
          </div>

          {/* TAB 1: THEMES */}
          {activeTab === 'theme' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <span className="text-[11px] text-stone-600 block mb-1 font-medium">
                اختر الثيم اللوني الفاخر لكارت الولاء ومحفظة الهاتف:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CUSTOMER_THEMES.map((theme) => {
                  const isSelected = customization.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onChange({ themeId: theme.id });
                      }}
                      className={`p-2.5 rounded-2xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 ring-2 ring-amber-300/60 bg-amber-50/60 shadow-xs'
                          : 'border-[#EADBCE] bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                          style={{ backgroundColor: theme.accentHex }}
                        />
                        <span className="text-[11px] font-bold text-[#231C18] truncate">
                          {theme.nameAr.split('(')[0]}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label htmlFor="customizer-name-input" className="block text-[11px] font-bold text-stone-700 mb-1">
                  اسمك أو لقبك على الكارت:
                </label>
                <input
                  id="customizer-name-input"
                  type="text"
                  maxLength={24}
                  value={customization.customerName}
                  onChange={(e) => onChange({ customerName: e.target.value })}
                  placeholder="مثال: أحمد، سارة، متذوق القهوة..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EADBCE] bg-white text-[#231C18] focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] font-bold text-stone-700 mb-1">
                  شارة عضويتك المفضلة:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMER_BADGES.map((badge) => {
                    const isSelected = customization.badgeTitle === badge.title;
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          onChange({ badgeTitle: badge.title });
                        }}
                        className={`p-2 rounded-xl border text-right transition flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-2xs'
                            : 'border-[#EADBCE] bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{badge.icon}</span>
                          <span>{badge.title}</span>
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-amber-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAMP ICONS */}
          {activeTab === 'stamp' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <span className="block text-[11px] font-bold text-stone-700 mb-1">
                  رمز الختم المفضل لزياراتك:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {STAMP_ICONS.map((st) => {
                    const isSelected = customization.stampEmoji === st.emoji;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          onChange({ stampEmoji: st.emoji });
                        }}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50 shadow-xs'
                            : 'border-[#EADBCE] bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xl">{st.emoji}</span>
                        <span className="text-[10px] text-stone-600 font-bold">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKGROUND & PHOTO UPLOAD */}
          {activeTab === 'background' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <span className="text-[11px] text-stone-600 block mb-1 font-medium">
                خصص خلفية الكارت بخامة راقية أو صورة شخصية خاصة بك:
              </span>

              {/* Luxury Textures Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    onChange({
                      customBackgroundUrl: undefined,
                      backgroundPresetId: undefined,
                    });
                  }}
                  className={`p-2.5 rounded-2xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                    !customization.customBackgroundUrl
                      ? 'border-amber-600 ring-2 ring-amber-300/60 bg-amber-50/60 shadow-xs'
                      : 'border-[#EADBCE] bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-stone-300 bg-stone-100 flex items-center justify-center text-[10px]">☕</span>
                    <span className="text-[11px] font-bold text-[#231C18]">خلفية المتجر</span>
                  </div>
                  {!customization.customBackgroundUrl && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                </button>

                {CURATED_CARD_PRESETS.map((preset) => {
                  const isSelected = customization.backgroundPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onChange({
                          customBackgroundUrl: preset.backgroundUrl,
                          backgroundPresetId: preset.id,
                          overlayOpacity: customization.overlayOpacity ?? preset.recommendedOverlayOpacity,
                        });
                      }}
                      className={`p-2.5 rounded-2xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 ring-2 ring-amber-300/60 bg-amber-50/60 shadow-xs'
                          : 'border-[#EADBCE] bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className="w-4 h-4 rounded-full border border-stone-400 shrink-0 bg-cover"
                          style={{ backgroundImage: `url(${preset.thumbnailUrl})` }}
                        />
                        <span className="text-[11px] font-bold text-[#231C18] truncate">
                          {preset.nameAr}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Photo Upload Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EADBCE] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#231C18] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-700" />
                    <span>رفع صورة خاصة (سيلفي أو قهوتك المفضلة)</span>
                  </span>
                  {customization.customBackgroundUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onChange({
                          customBackgroundUrl: undefined,
                          backgroundPresetId: undefined,
                        });
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>استعادة الأصل</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>{isUploading ? 'جاري تحسين وضغط الصورة...' : '📸 اختيار صورة من هاتفك'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isUploading}
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                {uploadNotice && (
                  <p className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 font-bold animate-in fade-in">
                    ✓ {uploadNotice}
                  </p>
                )}

                {/* Opacity slider */}
                {customization.customBackgroundUrl && (
                  <div className="pt-2 border-t border-[#EADBCE]/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                      <span>تظليل وتعتيم الصورة لبروز الأختام:</span>
                      <span className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                        {Math.round((customization.overlayOpacity ?? 0.65) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={0.9}
                      step={0.05}
                      value={customization.overlayOpacity ?? 0.65}
                      onChange={(e) => onChange({ overlayOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-amber-700 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
