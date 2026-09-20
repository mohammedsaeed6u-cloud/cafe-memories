'use client';

import React, { useState } from 'react';
import {
  BusinessSettings,
  PhotoboothFrame,
  StripOrientation,
  FrameShapeStyle,
  CardColorPalette,
} from '@/types/photobooth';
import { PRESET_EMOJI_PAIRS, PRESET_COLOR_PALETTES, PHOTOBOOTH_CARD_MODES } from '@/lib/constants/photobooth-presets';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { PhotoboothCardMode, PlacedSticker } from '@/types/photobooth';
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
  Palette,
  Sliders,
  Lock,
  Eye,
  CheckSquare,
  Square,
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
      shotCount: settings.defaultShotCount,
      orientation: settings.defaultOrientation,
      frameShape: settings.defaultFrameShape || 'rounded',
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
      'warm-amber',
      'ivory-cream',
      'terracotta-clay',
    ]
  );
  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    activeFrame.cardMode || settings.defaultCardMode || 'korean_noir'
  );
  const [allowCustomerModes, setAllowCustomerModes] = useState<boolean>(
    settings.allowCustomerModeChoice ?? true
  );
  const [allowCustomerStickers, setAllowCustomerStickers] = useState<boolean>(
    settings.allowCustomerStickers ?? true
  );
  const [previewStickers, setPreviewStickers] = useState<PlacedSticker[]>([]);

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

  const [frameShape, setFrameShape] = useState<FrameShapeStyle>(
    settings.defaultFrameShape || 'rounded'
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Custom Color State
  const [isCustomColorMode, setIsCustomColorMode] = useState(false);
  const [customBg, setCustomBg] = useState(activeFrame.bgColor || '#FAF8F5');
  const [customBorder, setCustomBorder] = useState(activeFrame.borderColor || '#E7E2D9');
  const [customText, setCustomText] = useState(activeFrame.textColor || '#1C1917');
  const [customAccent, setCustomAccent] = useState(activeFrame.accentColor || '#D97706');

  // Sample photos for live preview in studio
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

  // Shot Count Change (Freely controlled by merchant)
  const handleShotCountChange = (count: number) => {
    const valid = Math.max(Number(count) || 1, 1);
    setActiveFrame((prev) => ({ ...prev, shotCount: valid }));
  };

  // Orientation Change
  const handleOrientationChange = (orientation: StripOrientation) => {
    setActiveFrame((prev) => ({ ...prev, orientation }));
  };

  // Frame Shape Style Change
  const handleFrameShapeChange = (shape: FrameShapeStyle) => {
    setFrameShape(shape);
    setActiveFrame((prev) => ({ ...prev, frameShape: shape }));
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
        if (prev.length <= 1) return prev; // Keep at least one
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

    const normalizedFrames = settings.frames.map((f) =>
      f.id === activeFrame.id
        ? { ...activeFrame, shotCount, orientation, frameShape }
        : { ...f, shotCount, orientation, frameShape }
    );

    if (!normalizedFrames.some((f) => f.id === activeFrame.id)) {
      normalizedFrames.push({ ...activeFrame, shotCount, orientation, frameShape });
    }

    const updatedSettings: BusinessSettings = {
      ...settings,
      branding,
      freeGiftOffer: freeGift,
      activeFrameId: activeFrame.id,
      defaultShotCount: shotCount,
      defaultOrientation: orientation,
      defaultFrameShape: frameShape,
      activeColorPaletteId: activePaletteId,
      allowCustomerColorChoice: allowCustomerColors,
      allowedColorIds,
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
        {/* Section 1: Business Branding & Logo */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-stone-50/50"
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

        {/* Section 2: Frame Size, Shot Count & Shape */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  حجم وشكل الفريم (خاص بالتاجر)
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>محدد حصرياً من التاجر</span>
            </span>
          </div>

          <div className="space-y-4">
            {/* Free Shot Count Input */}
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
                  className="w-24 text-center font-mono font-black text-xl py-2 px-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-stone-50/50"
                />
                <span className="text-xs text-stone-500 font-medium">
                  صور (صورة واحدة لكل زيارة، والهدية توضع تلقائياً في الخانة الأخيرة)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-1 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                🔒 هذا الرقم موحد وثابت على جميع كروت العملاء في هذا الكافيه، ولا يمكن للعميل التلاعب بحجم الكارت.
              </p>
            </div>

            {/* Frame Orientation & Shape */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              {/* Orientation */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-amber-600" />
                  <span>توجيه الكارت:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
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
                    type="button"
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

              {/* Section 2.5: Photobooth Modes */}
            <div className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>مود وستايل الكارت الأساسي (Photobooth Mode):</span>
                </span>
                <span className="text-[10px] text-amber-700 font-mono font-bold">5 أنماط احترافية</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHOTOBOOTH_CARD_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setCardMode(mode.id);
                      setActiveFrame((prev) => ({
                        ...prev,
                        cardMode: mode.id,
                        bgColor: mode.defaultBg,
                        borderColor: mode.defaultBorder,
                        textColor: mode.defaultText,
                        accentColor: mode.defaultAccent,
                        badgeText: mode.filmBadge,
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-right transition flex items-start gap-2.5 ${
                      cardMode === mode.id
                        ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xl p-2 bg-white rounded-xl shadow-2xs shrink-0">{mode.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-900">{mode.nameAr}</span>
                        {cardMode === mode.id && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{mode.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Permissions checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-stone-100 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 cursor-pointer hover:bg-amber-50/40 transition">
                  <input
                    type="checkbox"
                    checked={allowCustomerModes}
                    onChange={(e) => setAllowCustomerModes(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-stone-700">السماح للعميل بتغيير المود بحرية</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 cursor-pointer hover:bg-amber-50/40 transition">
                  <input
                    type="checkbox"
                    checked={allowCustomerStickers}
                    onChange={(e) => setAllowCustomerStickers(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-stone-700">السماح بإضافة وتحريك ستيكرز وإيموجيز</span>
                </label>
              </div>
            </div>

            {/* Shape Style */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>شكل وحواف الفريم:</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'rounded', label: 'مودرن ناعم' },
                    { id: 'sharp', label: 'كلاسيك حاد' },
                    { id: 'polaroid', label: 'بولارويد' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleFrameShapeChange(s.id as FrameShapeStyle)}
                      className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition ${
                        frameShape === s.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Color Studio & Merchant Allowed Colors */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">
              ألوان وثيم الكارت، وتحديد الألوان المتاحة للعميل
            </h3>
          </div>

          <div className="space-y-5">
            {/* Primary Palette Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                أ) اختر ثيم الكارت الأساسي للكافيه:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_COLOR_PALETTES.map((palette) => {
                  const isSelected = !isCustomColorMode && activePaletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => handleSelectPalette(palette)}
                      className={`p-2.5 rounded-xl border-2 text-right transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 shadow-sm font-bold ring-2 ring-amber-500/20'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          style={{
                            backgroundColor: palette.bgColor,
                            borderColor: palette.borderColor,
                          }}
                          className="w-5 h-5 rounded-full border-2 shadow-xs shrink-0"
                        />
                        <span className="text-xs text-stone-800 truncate">
                          {palette.nameAr}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}

                {/* Custom Color Button */}
                <button
                  type="button"
                  onClick={() => setIsCustomColorMode(true)}
                  className={`p-2.5 rounded-xl border-2 text-right transition flex items-center justify-between gap-2 ${
                    isCustomColorMode
                      ? 'border-amber-600 bg-amber-50/60 shadow-sm font-bold ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border-2 border-amber-600 shadow-xs shrink-0" />
                    <span className="text-xs text-stone-800 truncate">🎨 ألوان مخصصة</span>
                  </div>
                  {isCustomColorMode && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Custom HEX Colors (if custom mode active) */}
            {isCustomColorMode && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-stone-800 block">
                  تحديد الألوان يدويّاً (HEX):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-1">الخلفية:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, bgColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, bgColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-1">الإطار:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customBorder}
                        onChange={(e) => {
                          setCustomBorder(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, borderColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customBorder}
                        onChange={(e) => {
                          setCustomBorder(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, borderColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-1">النصوص:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customText}
                        onChange={(e) => {
                          setCustomText(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, textColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => {
                          setCustomText(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, textColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-1">التمييز:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customAccent}
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, accentColor: e.target.value }));
                        }}
                        className="w-7 h-7 rounded-md border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customAccent}
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          setActiveFrame((prev) => ({ ...prev, accentColor: e.target.value }));
                        }}
                        className="w-full text-xs font-mono p-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Control: Allowed Colors for Customers */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block">
                    ب) تحديد الألوان المتاحة للعميل (صلاحيات العميل):
                  </label>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    حدد ما إذا كان العميل يستطيع اختيار لون الكارت وما هي الألوان المصرح بها
                  </p>
                </div>

                {/* Toggle switch */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCustomerColors}
                    onChange={(e) => setAllowCustomerColors(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-stone-700">
                    {allowCustomerColors ? 'مسموح للعميل الاختيار' : '🔒 الكارت مقفول بلون واحد'}
                  </span>
                </label>
              </div>

              {allowCustomerColors ? (
                <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 animate-in fade-in">
                  <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
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
                          className={`p-2 rounded-xl border text-right transition flex items-center justify-between gap-1.5 ${
                            isAllowed
                              ? 'bg-white border-amber-500 shadow-xs'
                              : 'bg-stone-100 border-stone-200 opacity-60'
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
                            <span className="text-[11px] font-bold text-stone-800 truncate">
                              {palette.nameAr}
                            </span>
                          </div>
                          {isAllowed ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium pt-1">
                    ✨ العميل سيرى فقط الألوان المُعلّمة أعلاه، دون أي تغيير في عدد الصور أو أبعاد الكارت.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-stone-100 rounded-xl text-center text-xs text-stone-600 font-medium border border-stone-200">
                  🔒 تم قفل الألوان — سيظهر الكارت للعملاء باللون الأساسي المعتمد فقط.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Reward on the Last Slot */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              4
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-stone-50/50"
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-stone-50/50"
                placeholder="يظهر للباريستا لتسليم المشروب وطباعة الشريط الورقي"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Corner Emojis */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                5
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
                type="button"
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
            type="button"
            onClick={handleSaveAll}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white font-black text-base shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border border-stone-700 active:scale-[0.98]"
          >
            <Save className="w-5 h-5 text-amber-400" />
            <span>حفظ الإعدادات وتطبيقها فوراً على كروت العملاء</span>
          </button>

          {isSavedNotice && (
            <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 animate-in fade-in shadow-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ وتطبيق حجم الكارت ({activeFrame.shotCount} صور)، وتوجيهه، وثيم الألوان، والألوان المصرح بها للعملاء بنجاح!</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Interactive Card Preview (5 cols) */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="p-6 bg-gradient-to-b from-[#F5F2EB] to-[#FAF8F5] rounded-3xl border border-stone-200/90 shadow-md flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <span className="text-xs font-black tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>معاينة كارت الولاء المطبوع</span>
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
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

          <p className="text-[11px] text-stone-500 mt-4 text-center font-medium leading-relaxed">
            يملأ العميل صورة في كل زيارة، وتظهر هديته المحددة في الخانة الأخيرة لتحفيزه على إكمال الكارت.
            {allowCustomerColors ? ' (العميل مخوّل لاختيار لونه المفضل من الألوان المحددة)' : ' (الكارت مقفول بلون الكافيه الموحد)'}
          </p>
        </div>
      </div>
    </div>
  );
};
