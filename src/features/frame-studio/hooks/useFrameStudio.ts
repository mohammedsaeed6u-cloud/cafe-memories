'use client';

import { useState } from 'react';
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
  PHOTOBOOTH_FRAME_TEMPLATES,
  DIMENSION_PRESETS,
} from '@/lib/constants/photobooth-presets';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { UseFrameStudioReturn } from '../types';

export function useFrameStudio(
  settings: BusinessSettings,
  onSettingsUpdated: (newSettings: BusinessSettings) => void
): UseFrameStudioReturn {
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
  const [isCardFlipped, setIsCardFlipped] = useState(false);
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

  const [frameShape, setFrameShape] = useState<FrameShapeStyle>(
    activeFrame.frameShape || settings.defaultFrameShape || 'rounded'
  );
  const [borderRadius, setBorderRadius] = useState<number>(() =>
    activeFrame.borderRadius !== undefined
      ? Number(activeFrame.borderRadius) || 0
      : settings.defaultBorderRadius ?? 16
  );

  const [badgeText, setBadgeText] = useState<string>(activeFrame.badgeText || '');
  const [customText, setCustomText] = useState<string>(activeFrame.customText || '');

  const [previewStickers, setPreviewStickers] = useState<PlacedSticker[]>([]);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const [isCustomColorMode, setIsCustomColorMode] = useState(false);
  const [customBg, setCustomBg] = useState(activeFrame.bgColor || '#FAF8F5');
  const [customBorder, setCustomBorder] = useState(activeFrame.borderColor || '#E7E2D9');
  const [customTextColor, setCustomTextColor] = useState(activeFrame.textColor || '#1C1917');
  const [customAccent, setCustomAccent] = useState(activeFrame.accentColor || '#D97706');

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

  const handleShotCountChange = (count: number) => {
    const valid = Math.max(1, Math.min(8, Number(count) || 1));
    setActiveFrame((prev) => ({ ...prev, shotCount: valid }));
  };

  const handleOrientationChange = (orientation: StripOrientation) => {
    setActiveFrame((prev) => ({ ...prev, orientation }));
  };

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

  return {
    activeFrame,
    setActiveFrame,
    branding,
    setBranding,
    isCardFlipped,
    setIsCardFlipped,
    freeGift,
    setFreeGift,
    activePaletteId,
    setActivePaletteId,
    allowCustomerColors,
    setAllowCustomerColors,
    allowedColorIds,
    setAllowedColorIds,
    selectedTemplateId,
    setSelectedTemplateId,
    cardMode,
    setCardMode,
    allowCustomerStickers,
    setAllowCustomerStickers,
    lockFrameForCustomers,
    setLockFrameForCustomers,
    businessType,
    setBusinessType,
    dimensionsPreset,
    setDimensionsPreset,
    widthCm,
    setWidthCm,
    heightCm,
    setHeightCm,
    frameShape,
    setFrameShape,
    borderRadius,
    setBorderRadius,
    badgeText,
    setBadgeText,
    customText,
    setCustomText,
    previewStickers,
    setPreviewStickers,
    isSavedNotice,
    isCustomColorMode,
    setIsCustomColorMode,
    customBg,
    setCustomBg,
    customBorder,
    setCustomBorder,
    customTextColor,
    setCustomTextColor,
    customAccent,
    setCustomAccent,
    samplePhotos,
    handlePreviewAddSticker,
    handleLogoUpload,
    handleShotCountChange,
    handleOrientationChange,
    handleSelectDimensionPreset,
    handleCustomDimensionChange,
    handleBorderRadiusChange,
    handleSelectFrameShape,
    handleSelectTemplate,
    handleSelectPalette,
    handleToggleAllowedColor,
    handleSelectEmojiPair,
    handleSaveAll,
  };
}
