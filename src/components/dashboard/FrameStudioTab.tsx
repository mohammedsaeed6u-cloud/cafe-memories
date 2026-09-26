'use client';

import React, { useState } from 'react';
import {
  BusinessSettings,
  PhotoboothFrame,
  StripOrientation,
  FrameShapeStyle,
  CardColorPalette,
  BusinessType,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import {
  PRESET_EMOJI_PAIRS,
  PRESET_COLOR_PALETTES,
  PHOTOBOOTH_CARD_MODES,
  PHOTOBOOTH_FRAME_TEMPLATES,
  BUSINESS_INDUSTRY_OPTIONS,
  DIMENSION_PRESETS,
  SHOT_COUNT_OPTIONS,
} from '@/lib/constants/photobooth-presets';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import {
  Sparkles,
  Upload,
  Check,
  Layout,
  Save,
  Image as ImageIcon,
  Lock,
  CheckSquare,
  Square,
  Sliders,
  Maximize2,
  Layers,
  Sparkle,
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
    const base =
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0];
    return {
      ...base,
      shotCount: settings.defaultShotCount || base.shotCount || 3,
      orientation: settings.defaultOrientation || base.orientation || 'vertical',
      frameShape: settings.defaultFrameShape || base.frameShape || 'rounded',
      borderRadius: base.borderRadius ?? (settings.defaultBorderRadius ?? 16),
      widthCm: base.widthCm || settings.defaultWidthCm || 5,
      heightCm: base.heightCm || settings.defaultHeightCm || 15.2,
      cardMode: base.cardMode || settings.defaultCardMode || 'korean_noir',
    };
  });

  const [branding, setBranding] = useState(settings.branding);
  const [freeGift, setFreeGift] = useState(settings.freeGiftOffer);
  const [activePaletteId, setActivePaletteId] = useState<string>(
    settings.activeColorPaletteId || 'classic-latte'
  );
  const [allowCustomerColors, setAllowCustomerColors] = useState<boolean>(
    settings.allowCustomerColorChoice ?? true
  );
  const [allowedColorIds, setAllowedColorIds] = useState<string[]>(
    settings.allowedColorIds || [
      'classic-latte',
      'noir-korean',
      'arabica-gold',
      'tokyo-pastel',
      'kinfolk-ivory',
      'analog-35mm',
      'warm-amber',
      'terracotta-clay',
    ]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    activeFrame.templateId || 'korean_noir_2x6'
  );
  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    activeFrame.cardMode || settings.defaultCardMode || 'korean_noir'
  );
  const [allowCustomerStickers, setAllowCustomerStickers] = useState<boolean>(
    settings.allowCustomerStickers ?? true
  );
  const [lockFrameForCustomers, setLockFrameForCustomers] = useState<boolean>(
    settings.lockFrameForCustomers ?? true
  );
  const [businessType, setBusinessType] = useState<BusinessType>(
    settings.businessType || 'cafe'
  );

  // Dimension & Sizing State
  const [dimensionsPreset, setDimensionsPreset] = useState<string>(() => {
    if (activeFrame.widthCm === 5 && activeFrame.heightCm === 15.2) return 'strip_2x6';
    if (activeFrame.widthCm === 10 && activeFrame.heightCm === 15.2) return 'grid_4x6';
    if (activeFrame.widthCm === 10 && activeFrame.heightCm === 7.6) return 'wide_4x3';
    if (activeFrame.widthCm === 8.8 && activeFrame.heightCm === 10.7) return 'polaroid_vintage';
    if (activeFrame.widthCm === 15.2 && activeFrame.heightCm === 5) return 'cinema_6x2';
    return settings.defaultDimensionsPreset || 'strip_2x6';
  });

  const [widthCm, setWidthCm] = useState<number>(activeFrame.widthCm || 5);
  const [heightCm, setHeightCm] = useState<number>(activeFrame.heightCm || 15.2);

  // Border Radius & Shape
  const [frameShape, setFrameShape] = useState<FrameShapeStyle>(
    activeFrame.frameShape || settings.defaultFrameShape || 'rounded'
  );
  const [borderRadius, setBorderRadius] = useState<number>(() =>
    activeFrame.borderRadius !== undefined
      ? Number(activeFrame.borderRadius) || 0
      : settings.defaultBorderRadius ?? 16
  );

  // Custom Branding Text details
  const [badgeText, setBadgeText] = useState<string>(activeFrame.badgeText || '');
  const [customText, setCustomText] = useState<string>(activeFrame.customText || '');

  const [previewStickers, setPreviewStickers] = useState<PlacedSticker[]>([]);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Custom Color State
  const [isCustomColorMode, setIsCustomColorMode] = useState(false);
  const [customBg, setCustomBg] = useState(activeFrame.bgColor || '#FAF8F5');
  const [customBorder, setCustomBorder] = useState(activeFrame.borderColor || '#E7E2D9');
  const [customTextColor, setCustomTextColor] = useState(activeFrame.textColor || '#1C1917');
  const [customAccent, setCustomAccent] = useState(activeFrame.accentColor || '#D97706');

  // Clean production preview slots ready for live capture
  const samplePhotos: string[] = [];

  const handlePreviewAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    const randomOffset = (Math.random() - 0.5) * 20;
    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji: emoji.trim(),
      x: Math.max(15, Math.min(85, 50 + randomOffset)),
      y: Math.max(15, Math.min(85, 40 + randomOffset)),
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    setPreviewStickers((prev) => [...prev, newSticker]);
  };

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

  // Shot Count Change (Freely controlled by merchant: 1, 2, 3, 4, 6, etc.)
  const handleShotCountChange = (count: number) => {
    const valid = Math.max(1, Math.min(8, Number(count) || 1));
    setActiveFrame((prev) => ({ ...prev, shotCount: valid }));
  };

  // Orientation Change
  const handleOrientationChange = (orientation: StripOrientation) => {
    setActiveFrame((prev) => ({ ...prev, orientation }));
  };

  // Dimension Preset Pick
  const handleSelectDimensionPreset = (presetId: string) => {
    setDimensionsPreset(presetId);
    const preset = DIMENSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setActiveFrame((prev) => ({
      ...prev,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      orientation: preset.orientation,
    }));
  };

  // Custom Dimensions Change
  const handleCustomDimensionChange = (newWidth: number, newHeight: number) => {
    const w = Math.max(2, Math.min(40, Number(newWidth) || 5));
    const h = Math.max(2, Math.min(50, Number(newHeight) || 15.2));
    setWidthCm(w);
    setHeightCm(h);
    setDimensionsPreset('custom');
    setActiveFrame((prev) => ({
      ...prev,
      widthCm: w,
      heightCm: h,
    }));
  };

  // Border Radius Slider Change
  const handleBorderRadiusChange = (radius: number) => {
    const val = Math.max(0, Math.min(36, Number(radius) || 0));
    setBorderRadius(val);
    const shape: FrameShapeStyle = val === 0 ? 'sharp' : val >= 24 ? 'pill' : 'rounded';
    setFrameShape(shape);
    setActiveFrame((prev) => ({
      ...prev,
      borderRadius: val,
      frameShape: shape,
    }));
  };

  // Frame Shape Preset Pick
  const handleSelectFrameShape = (shape: FrameShapeStyle) => {
    setFrameShape(shape);
    const newRadius = shape === 'sharp' ? 0 : shape === 'polaroid' ? 16 : shape === 'pill' ? 28 : 18;
    setBorderRadius(newRadius);
    setActiveFrame((prev) => ({
      ...prev,
      frameShape: shape,
      borderRadius: newRadius,
    }));
  };

  // Frame Template / Identity Selection
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedTemplateId(templateId);

    const newMode: PhotoboothCardMode =
      tmpl.cardMode ||
      (templateId.includes('noir')
        ? 'korean_noir'
        : templateId.includes('tokyo')
        ? 'tokyo_pastel'
        : templateId.includes('kinfolk')
        ? 'kinfolk_minimal'
        : templateId.includes('film')
        ? 'film_35mm'
        : templateId.includes('arabica')
        ? 'arabica_luxury_gold'
        : templateId.includes('polaroid')
        ? 'polaroid_vintage'
        : 'korean_noir');

    setCardMode(newMode);
    setBadgeText(tmpl.badge);

    if (tmpl.widthCm) setWidthCm(tmpl.widthCm);
    if (tmpl.heightCm) setHeightCm(tmpl.heightCm);

    setActiveFrame((prev) => ({
      ...prev,
      templateId: tmpl.id,
      layoutType: tmpl.layoutType,
      shotCount: tmpl.shotCount,
      orientation: tmpl.orientation,
      widthCm: tmpl.widthCm,
      heightCm: tmpl.heightCm,
      cardMode: newMode,
      bgColor: tmpl.defaultBg,
      borderColor: tmpl.defaultBorder,
      textColor: tmpl.defaultText,
      accentColor: tmpl.defaultAccent,
      badgeText: tmpl.badge,
    }));
  };

  // Preset Palette Pick
  const handleSelectPalette = (palette: CardColorPalette) => {
    setActivePaletteId(palette.id);
    setIsCustomColorMode(false);
    setActiveFrame((prev) => ({
      ...prev,
      bgColor: palette.bgColor,
      borderColor: palette.borderColor,
      textColor: palette.textColor,
      accentColor: palette.accentColor,
    }));
  };

  // Toggle an allowed color for customer
  const handleToggleAllowedColor = (paletteId: string) => {
    setAllowedColorIds((prev) => {
      if (prev.includes(paletteId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== paletteId);
      } else {
        return [...prev, paletteId];
      }
    });
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
    const shotCount = activeFrame.shotCount;
    const orientation = activeFrame.orientation;

    const frameToSave: PhotoboothFrame = {
      ...activeFrame,
      shotCount,
      orientation,
      frameShape,
      borderRadius,
      widthCm,
      heightCm,
      cardMode,
      badgeText,
      customText,
      templateId: selectedTemplateId || activeFrame.templateId,
    };

    const normalizedFrames = settings.frames.map((f) =>
      f.id === activeFrame.id
        ? frameToSave
        : {
            ...f,
            shotCount,
            orientation,
            frameShape,
            borderRadius,
            widthCm,
            heightCm,
            cardMode,
            badgeText,
            customText,
          }
    );

    if (!normalizedFrames.some((f) => f.id === activeFrame.id)) {
      normalizedFrames.push(frameToSave);
    }

    const updatedSettings: BusinessSettings = {
      ...settings,
      businessType,
      branding,
      freeGiftOffer: freeGift,
      activeFrameId: activeFrame.id,
      defaultTemplateId: selectedTemplateId || activeFrame.templateId,
      defaultLayoutType: activeFrame.layoutType,
      defaultShotCount: shotCount,
      defaultOrientation: orientation,
      defaultFrameShape: frameShape,
      defaultBorderRadius: borderRadius,
      defaultDimensionsPreset: dimensionsPreset,
      defaultWidthCm: widthCm,
      defaultHeightCm: heightCm,
      defaultCardMode: cardMode,
      activeColorPaletteId: activePaletteId,
      allowCustomerColorChoice: allowCustomerColors,
      allowedColorIds,
      lockFrameForCustomers,
      allowCustomerStickers,
      frames: normalizedFrames,
    };

    BusinessSettingsService.saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Controls (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Section 0: Business Industry / Multi-Sector Selector */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
                0
              </div>
              <div>
                <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                  نوع ونشاط البيزنس (Multi-Industry)
                </h3>
                <p className="text-xs text-[#A19E9B] mt-0.5">
                  حدد مجال عملك لتخصيص الهدايا، تسميات الموظفين، وتجربة كارت الولاء
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30">
              متعدد الأنشطة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {BUSINESS_INDUSTRY_OPTIONS.map((ind) => {
              const isSelected = businessType === ind.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => {
                    setBusinessType(ind.id as BusinessType);
                    if (!freeGift.title || freeGift.title === 'مشروب مجاني أو هدية فورية') {
                      setFreeGift({
                        ...freeGift,
                        title: ind.defaultGiftTitle,
                        subtitle: ind.defaultGiftSubtitle,
                      });
                    }
                  }}
                  className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'border-[#DD0200] bg-[#55100D]/30 shadow-md ring-1 ring-[#DD0200]'
                      : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{ind.icon}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#DD0200]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#FBF9F5] block leading-tight">
                      {ind.nameAr}
                    </span>
                    <span className="text-[10px] text-[#A19E9B] line-clamp-1 mt-0.5">
                      الموظف: {ind.staffLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: Business Branding, Logo & Custom Texts */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                هوية البيزنس والنصوص التحريرية (Custom Branding & Texts)
              </h3>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                خصص اسم المكان، الشعار، اللوجو، ونصوص الترويسة والتذييل على الكارت
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                  اسم المكان في ترويسة الكارت
                </label>
                <input
                  type="text"
                  value={branding.name}
                  onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
                  placeholder="مثلاً: Memories Studio أو Elixir Roastery"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                  بادج / ترويسة الفريم الإضافية (Header Badge)
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => {
                    setBadgeText(e.target.value);
                    setActiveFrame((prev) => ({ ...prev, badgeText: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 font-mono"
                  placeholder="مثلاً: SEOUL 4-CUTS // 35MM أو % ARABICA GOLD"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                حساب إنستغرام المتجر للمنشن (Instagram Handle)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#A19E9B] font-bold text-xs">@</span>
                <input
                  type="text"
                  value={(branding.instagramHandle || '').replace('@', '')}
                  onChange={(e) => setBranding({ ...branding, instagramHandle: `@${e.target.value.replace('@', '')}` })}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 font-mono"
                  placeholder="مثلاً: roastery.official"
                />
              </div>
              <p className="text-[10px] text-[#A19E9B] mt-1">يظهر للعميل في نهاية التجربة لعمل منشن للمكان في ستوري إنستغرام</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                نص التذييل / ذقن الكارت (Custom Chin / Footer Note)
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setActiveFrame((prev) => ({ ...prev, customText: e.target.value }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
                placeholder="مثلاً: special coffee memories أو A SENSE OF PLACE"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                لوجو المكان
              </label>
              <div className="flex items-center gap-4">
                {branding.logoUrl ? (
                  <div className="relative w-20 h-14 rounded-xl border border-white/10 bg-[#0B0A0A] flex items-center justify-center overflow-hidden p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={branding.logoUrl}
                      alt="Business Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-xl border border-dashed border-white/20 bg-[#0B0A0A] flex flex-col items-center justify-center text-[#A19E9B]">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[9px]">بدون لوجو</span>
                  </div>
                )}

                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold border border-white/10 flex items-center gap-2 transition">
                  <Upload className="w-3.5 h-3.5 text-[#A19E9B]" />
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
                    type="button"
                    onClick={() => setBranding({ ...branding, logoUrl: '' })}
                    className="text-xs text-rose-400 hover:underline font-medium cursor-pointer"
                  >
                    حذف اللوجو
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Core Distinctive Frame Identity Themes */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                  قوالب وثيمات الهوية البصرية (Frame Identity Themes)
                </h3>
                <p className="text-xs text-[#A19E9B] mt-0.5">
                  اختر من بين 6 هويات بصرية أيقونية مميزة تعكس طابع وأجواء علامتك التجارية
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#DD0200]" />
              <span>هويات أصلية</span>
            </span>
          </div>

          {/* Strict Frame Enforcement Toggle */}
          <div
            className={`p-4 rounded-xl border transition-all mb-4 ${
              lockFrameForCustomers
                ? 'bg-[#55100D]/30 border-[#DD0200]/40 ring-1 ring-[#DD0200]/40'
                : 'bg-[#1C1B1B]/70 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    lockFrameForCustomers ? 'bg-[#DD0200] text-white' : 'bg-[#1C1B1B] text-[#A19E9B]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FBF9F5]">
                      قفل الفريم إجبارياً على جميع العملاء (إلزامي وموحد)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lockFrameForCustomers
                          ? 'bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/40'
                          : 'bg-[#1C1B1B] text-[#A19E9B]'
                      }`}
                    >
                      {lockFrameForCustomers ? 'مُفعّل ومفروض' : 'اختياري للعميل'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A19E9B] mt-1 leading-relaxed">
                    عند التفعيل، يتم فرض عدد الصور ({activeFrame.shotCount} صور) وتوجيه الكارت ({activeFrame.orientation === 'vertical' ? 'رأسي' : 'أفقي'}) وقالب الهوية البصرية إجبارياً على جميع العملاء لمنع تشويه الهوية وضمان دقة الطباعة.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={lockFrameForCustomers}
                  onChange={(e) => setLockFrameForCustomers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1C1B1B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DD0200]"></div>
              </label>
            </div>
          </div>

          {/* Core Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PHOTOBOOTH_FRAME_TEMPLATES.map((tmpl) => {
              const isSelected = (selectedTemplateId || activeFrame.templateId) === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-3.5 rounded-xl border text-right transition flex items-start gap-3 relative cursor-pointer ${
                    isSelected
                      ? 'border-[#DD0200] bg-[#55100D]/30 shadow-md ring-1 ring-[#DD0200]'
                      : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70'
                  }`}
                >
                  <span className="text-2xl p-2 bg-[#0B0A0A] rounded-xl shadow-inner shrink-0 border border-white/10">
                    {tmpl.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FBF9F5] leading-tight font-serif">
                        {tmpl.nameAr}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#DD0200] shrink-0" />}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#0B0A0A] text-[#FBF9F5] rounded-md border border-white/10">
                        {tmpl.dimensions} ({tmpl.dimensionsCm})
                      </span>
                      <span className="text-[10px] font-bold text-[#DD0200]">
                        {tmpl.shotCount} {tmpl.shotCount === 1 ? 'لقطة' : 'صور'}
                      </span>
                      <span className="text-[9px] text-[#A19E9B] font-medium">
                        • {tmpl.orientation === 'vertical' ? 'رأسي' : 'أفقي'}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#A19E9B] mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Dimensions, Aspect Ratio & Arbitrary Shot Counts */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                  الأبعاد والمقاسات الفعلية وعدد الخانات (Dimensions & Slot Counts)
                </h3>
                <p className="text-xs text-[#A19E9B] mt-0.5">
                  تحكم كامل في مقاس الورق (سم / بوصة) وعدد صور الكارت (1، 2، 3، 4، 6 صور)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30">
              حرية كاملة
            </span>
          </div>

          <div className="space-y-4">
            {/* Standard Dimension Presets */}
            <div>
              <label className="block text-xs font-bold text-[#FBF9F5] mb-2">
                أ) اختر مقاس وأبعاد الكارت المطبوع:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIMENSION_PRESETS.map((preset) => {
                  const isSelected = dimensionsPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectDimensionPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#DD0200] bg-[#55100D]/30 font-bold ring-1 ring-[#DD0200] shadow-sm'
                          : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs text-[#FBF9F5] font-serif">{preset.nameAr}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#DD0200] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-[#A19E9B] font-mono">
                        <span>{preset.dimensionsCm}</span>
                        <span>•</span>
                        <span>{preset.aspectRatioLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom cm inputs (always available for fine-tuning) */}
            <div className="p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>تعديل الأبعاد بالسنتيمتر (Custom Dimensions):</span>
                </span>
                <span className="text-[10px] font-mono text-[#A19E9B]">
                  {widthCm} × {heightCm} سم
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#A19E9B] mb-1">
                    العرض (Width in cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="40"
                    value={widthCm}
                    onChange={(e) => handleCustomDimensionChange(parseFloat(e.target.value) || 5, heightCm)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-white/10 bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A19E9B] mb-1">
                    الارتفاع (Height in cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="50"
                    value={heightCm}
                    onChange={(e) => handleCustomDimensionChange(widthCm, parseFloat(e.target.value) || 15.2)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-white/10 bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Orientation Switcher: Vertical vs Horizontal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-[#DD0200] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#FBF9F5] block">توجيه الكارت (Card Orientation):</span>
                  <span className="text-[10px] text-[#A19E9B]">رأسي طولي (شريط فوتوبوث) أو أفقي عريض (بوستكارد)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#141212] p-1 rounded-xl border border-white/10 self-stretch sm:self-auto justify-center">
                <button
                  type="button"
                  onClick={() => handleOrientationChange('vertical')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-none text-center cursor-pointer ${
                    activeFrame.orientation === 'vertical'
                      ? 'bg-[#DD0200] text-white shadow-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'text-[#A19E9B] hover:text-[#FBF9F5]'
                  }`}
                >
                  رأسي (Vertical)
                </button>
                <button
                  type="button"
                  onClick={() => handleOrientationChange('horizontal')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-none text-center cursor-pointer ${
                    activeFrame.orientation === 'horizontal'
                      ? 'bg-[#DD0200] text-white shadow-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'text-[#A19E9B] hover:text-[#FBF9F5]'
                  }`}
                >
                  أفقي عريض (Horizontal)
                </button>
              </div>
            </div>

            {/* Number of Photo Slots / Cuts (عدد الخانات) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#FBF9F5] block">
                  ب) عدد خانات الصور في الكارت (عدد الزيارات المطلوبة لاكتمال الكارت):
                </label>
                <span className="text-xs font-mono font-bold text-[#FBF9F5] bg-[#55100D] px-2 py-0.5 rounded-md border border-[#DD0200]/30">
                  {activeFrame.shotCount} خانات
                </span>
              </div>

              {/* Standard Options 1, 2, 3, 4, 6 cuts */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                {SHOT_COUNT_OPTIONS.map((shotOpt) => {
                  const isSelected = activeFrame.shotCount === shotOpt.count;
                  return (
                    <button
                      key={shotOpt.count}
                      type="button"
                      onClick={() => handleShotCountChange(shotOpt.count)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] shadow-xs ring-1 ring-[#DD0200]'
                          : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                      }`}
                    >
                      <span className="text-xs font-bold">{shotOpt.count} {shotOpt.count === 1 ? 'لقطة' : 'صور'}</span>
                      <span className="text-[9px] font-mono text-[#A19E9B]">{shotOpt.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Number Stepper */}
              <div className="flex items-center justify-between p-2.5 bg-[#0B0A0A] rounded-xl border border-white/10">
                <span className="text-[11px] font-bold text-[#A19E9B]">
                  أو حدد عدداً مخصصاً للصور (1 إلى 8):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShotCountChange((activeFrame.shotCount || 3) - 1)}
                    disabled={(activeFrame.shotCount || 3) <= 1}
                    className="w-7 h-7 rounded-lg bg-[#1C1B1B] border border-white/10 font-bold text-[#FBF9F5] hover:bg-[#252424] hover:border-white/20 disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-bold text-[#FBF9F5]">
                    {activeFrame.shotCount || 3}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShotCountChange((activeFrame.shotCount || 3) + 1)}
                    disabled={(activeFrame.shotCount || 3) >= 8}
                    className="w-7 h-7 rounded-lg bg-[#1C1B1B] border border-white/10 font-bold text-[#FBF9F5] hover:bg-[#252424] hover:border-white/20 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Border Radius & Frame Shape Styling */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                  انحناء الحواف وشكل الكارت (Border Radius & Shape)
                </h3>
                <p className="text-xs text-[#A19E9B] mt-0.5">
                  حدد درجة استدارة حواف الكارت بما يتناسب مع هوية المكان
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1C1B1B] text-[#FBF9F5] border border-white/10">
              {borderRadius}px
            </span>
          </div>

          <div className="space-y-4">
            {/* Quick Shape Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectFrameShape('sharp')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  borderRadius === 0
                    ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] ring-1 ring-[#DD0200]'
                    : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                }`}
              >
                <span className="text-xs block font-bold">حواف حادة (0px)</span>
                <span className="text-[10px] text-[#A19E9B]">كلاسيكي مستقيم</span>
              </button>
              <button
                type="button"
                onClick={() => handleBorderRadiusChange(12)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  borderRadius === 12
                    ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] ring-1 ring-[#DD0200]'
                    : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                }`}
              >
                <span className="text-xs block font-bold">حواف ناعمة (12px)</span>
                <span className="text-[10px] text-[#A19E9B]">انحناء طبيعي هادئ</span>
              </button>
              <button
                type="button"
                onClick={() => handleBorderRadiusChange(20)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  borderRadius === 20
                    ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] ring-1 ring-[#DD0200]'
                    : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                }`}
              >
                <span className="text-xs block font-bold">عصري مستدير (20px)</span>
                <span className="text-[10px] text-[#A19E9B]">مودرن ومريح</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectFrameShape('polaroid')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  frameShape === 'polaroid'
                    ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] ring-1 ring-[#DD0200]'
                    : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                }`}
              >
                <span className="text-xs block font-bold">ذقن بولارويد</span>
                <span className="text-[10px] text-[#A19E9B]">كاميرا فورية</span>
              </button>
            </div>

            {/* Fine Radius Slider */}
            <div className="p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>التحكم الدقيق في درجة الاستدارة (Border Radius Slider):</span>
                </label>
                <span className="text-xs font-mono font-bold text-[#DD0200]">{borderRadius} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="1"
                value={borderRadius}
                onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#DD0200] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#A19E9B] font-mono mt-1">
                <span>0px (حواف مستقيمة حادة)</span>
                <span>16px (افتراضي)</span>
                <span>32px (حواف دائرية بالكامل)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Color Studio & Merchant Allowed Colors */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                ألوان وثيم الكارت، وتحديد الألوان المصرح بها للعميل
              </h3>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                اختر ثيم ألوان علامتك أو خصص الألوان يدوياً وحدد صلاحيات العميل في تغيير اللون
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Primary Palette Selection */}
            <div>
              <label className="block text-xs font-bold text-[#FBF9F5] mb-2">
                أ) اختر باليتة وثيم الكارت الأساسي للمنشأة:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_COLOR_PALETTES.map((palette) => {
                  const isSelected = !isCustomColorMode && activePaletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => handleSelectPalette(palette)}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#DD0200] bg-[#55100D]/30 shadow-sm font-bold ring-1 ring-[#DD0200]'
                          : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          style={{
                            backgroundColor: palette.bgColor,
                            borderColor: palette.borderColor,
                          }}
                          className="w-5 h-5 rounded-full border shadow-xs shrink-0"
                        />
                        <span className="text-xs text-[#FBF9F5] font-serif truncate">
                          {palette.nameAr}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#DD0200] shrink-0" />}
                    </button>
                  );
                })}

                {/* Custom Color Button */}
                <button
                  type="button"
                  onClick={() => setIsCustomColorMode(true)}
                  className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                    isCustomColorMode
                      ? 'border-[#DD0200] bg-[#55100D]/30 shadow-sm font-bold ring-1 ring-[#DD0200]'
                      : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#DD0200] to-[#55100D] border border-white/20 shadow-xs shrink-0" />
                    <span className="text-xs text-[#FBF9F5] font-serif truncate">ألوان مخصصة</span>
                  </div>
                  {isCustomColorMode && <Check className="w-3.5 h-3.5 text-[#DD0200] shrink-0" />}
                </button>
              </div>
            </div>

            {/* Custom HEX Colors (if custom mode active) */}
            {isCustomColorMode && (
              <div className="p-4 bg-[#0B0A0A] rounded-xl border border-white/10 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-[#FBF9F5] block">
                  تحديد الألوان يدوياً (HEX Colors):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#A19E9B] font-bold mb-1">الخلفية:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, bgColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, bgColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A19E9B] font-bold mb-1">الإطار:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customBorder}
                        onChange={(e) => {
                          setCustomBorder(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, borderColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customBorder}
                        onChange={(e) => {
                          setCustomBorder(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, borderColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A19E9B] font-bold mb-1">النصوص:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customTextColor}
                        onChange={(e) => {
                          setCustomTextColor(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, textColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customTextColor}
                        onChange={(e) => {
                          setCustomTextColor(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, textColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A19E9B] font-bold mb-1">التمييز:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customAccent}
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, accentColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customAccent}
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, accentColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#DD0200] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Control: Allowed Colors for Customers */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-xs font-bold text-[#FBF9F5] block">
                    ب) تحديد الألوان المتاحة للعميل:
                  </label>
                  <p className="text-[11px] text-[#A19E9B] mt-0.5">
                    حدد ما إذا كان العميل يستطيع اختيار لون الكارت وما هي الألوان المصرح بها
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCustomerColors}
                    onChange={(e) => setAllowCustomerColors(e.target.checked)}
                    className="w-4 h-4 rounded text-[#DD0200] bg-[#141212] border-white/20 focus:ring-[#DD0200] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#FBF9F5]">
                    {allowCustomerColors ? 'مسموح للعميل الاختيار' : 'الكارت مقفول بلون واحد'}
                  </span>
                </label>
              </div>

              {allowCustomerColors ? (
                <div className="space-y-2 p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10 animate-in fade-in">
                  <span className="text-[11px] font-bold text-[#A19E9B] block mb-1.5">
                    اختر الألوان التي يحق للعميل التبديل بينها:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_COLOR_PALETTES.map((palette) => {
                      const isAllowed = allowedColorIds.includes(palette.id);
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => handleToggleAllowedColor(palette.id)}
                          className={`p-2 rounded-xl border text-right transition flex items-center justify-between gap-1.5 cursor-pointer ${
                            isAllowed
                              ? 'bg-[#1C1B1B] border-[#DD0200] text-[#FBF9F5] shadow-xs'
                              : 'bg-[#141212] border-white/10 text-[#A19E9B] opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              style={{
                                backgroundColor: palette.bgColor,
                                borderColor: palette.borderColor,
                              }}
                              className="w-4 h-4 rounded-full border shrink-0"
                            />
                            <span className="text-[11px] font-bold text-[#FBF9F5] truncate">
                              {palette.nameAr}
                            </span>
                          </div>
                          {isAllowed ? (
                            <CheckSquare className="w-4 h-4 text-[#DD0200] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#A19E9B] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0B0A0A] rounded-xl text-center text-xs text-[#A19E9B] font-medium border border-white/10">
                  تم قفل الألوان — سيظهر الكارت للعملاء باللون الأساسي المعتمد فقط.
                </div>
              )}
            </div>

            {/* Customer Stickers Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-[#0B0A0A] cursor-pointer hover:border-white/20 transition">
                <input
                  type="checkbox"
                  checked={allowCustomerStickers}
                  onChange={(e) => setAllowCustomerStickers(e.target.checked)}
                  className="w-4 h-4 rounded text-[#DD0200] bg-[#141212] border-white/20 focus:ring-[#DD0200] cursor-pointer"
                />
                <span className="font-bold text-xs text-[#FBF9F5]">السماح للعميل بإضافة وتحريك ستيكرز وإيموجيز على الكارت</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 6: Reward on the Last Slot */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
              6
            </div>
            <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
              هدية وجائزة الخانة الأخيرة في الكارت
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
                اسم الهدية (تظهر داخل الخانة الأخيرة في شريط العميل)
              </label>
              <input
                type="text"
                value={freeGift.title}
                onChange={(e) => setFreeGift({ ...freeGift, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
                placeholder="مثلاً: مشروب مجاني مميز + طباعة الكارت"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
                شرح الاستلام لطاقم العمل أو موظف الكاونتر
              </label>
              <input
                type="text"
                value={freeGift.subtitle}
                onChange={(e) => setFreeGift({ ...freeGift, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
                placeholder="يظهر لطاقم الخدمة لتسليم الهدية وطباعة الشريط الورقي"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Corner Emojis */}
        <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold">
                7
              </div>
              <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
                ستيكرز الزوايا (Corner Emojis)
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#FBF9F5] cursor-pointer">
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
                className="rounded text-[#DD0200] bg-[#141212] border-white/20 focus:ring-[#DD0200] cursor-pointer"
              />
              <span>تفعيل الستيكرز</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {PRESET_EMOJI_PAIRS.map((pair, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectEmojiPair(pair.topRight, pair.bottomLeft)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                  activeFrame.cornerEmojis?.topRight === pair.topRight &&
                  activeFrame.cornerEmojis?.bottomLeft === pair.bottomLeft
                    ? 'border-[#DD0200] bg-[#55100D]/30 font-bold text-[#FBF9F5] ring-1 ring-[#DD0200]'
                    : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                }`}
              >
                <span>{pair.label}</span>
                <span className="text-base">
                  {pair.bottomLeft} {pair.topRight}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
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
                className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-white/10 focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
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
                className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-white/10 focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5]"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full py-4 px-6 rounded-2xl bg-[#DD0200] hover:bg-[#b00200] text-[#FBF9F5] font-black text-base shadow-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-2xl transition flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-5 h-5 text-white" />
            <span>حفظ الإعدادات وتطبيقها فوراً على كروت العملاء</span>
          </button>

          {isSavedNotice && (
            <div className="mt-3 p-3.5 bg-[#55100D]/40 border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 animate-in fade-in shadow-xs">
              <Check className="w-4 h-4 text-[#DD0200]" />
              <span>تم حفظ وتطبيق مقاس الكارت ({activeFrame.shotCount} صور)، أبعاده ({widthCm}×{heightCm} سم)، هويته وثيم ألوانه بنجاح!</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Interactive Card Preview (5 cols) */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="p-6 bg-[#141212] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <span className="text-xs font-black tracking-widest text-[#A19E9B] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#DD0200]" />
              <span>معاينة كارت الولاء المطبوع</span>
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 font-bold">
              {activeFrame.shotCount} خانات • {activeFrame.orientation === 'horizontal' ? 'أفقي' : 'رأسي'}
            </span>
          </div>

          {/* Card with Multi-Visit Slots & Last Slot Reward */}
          <PhotoboothStripCard
            photos={samplePhotos}
            frame={activeFrame}
            branding={branding}
            freeGiftOffer={freeGift}
            cardMode={cardMode}
            stickers={previewStickers}
            onUpdateStickers={setPreviewStickers}
            isStickersInteractive={true}
            onPrint={() => PrintService.printElement('printable-strip')}
          />

          {/* Sticker Test Tray in Studio Preview */}
          <div className="w-full mt-4">
            <StickerControlTray
              onAddSticker={handlePreviewAddSticker}
              stickersCount={previewStickers.length}
              onClearAll={() => setPreviewStickers([])}
            />
          </div>

          <p className="text-[11px] text-[#A19E9B] mt-4 text-center font-medium leading-relaxed">
            يملأ العميل صورة في كل زيارة، وتظهر هديته المحددة في الخانة الأخيرة لتحفيزه على إكمال الكارت.
            {allowCustomerColors ? ' (العميل مخوّل لاختيار لونه المفضل من الألوان المحددة)' : ' (الكارت مقفول بلون الكافيه الموحد)'}
          </p>
        </div>
      </div>
    </div>
  );
};
