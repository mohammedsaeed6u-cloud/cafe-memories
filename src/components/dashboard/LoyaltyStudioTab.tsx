'use client';

import React, { useState, useEffect } from 'react';
import {
  LoyaltyCardTemplate,
  LoyaltyCardDimensionType,
  LoyaltySlotCount,
  LoyaltyMilestone,
  LoyaltyMilestoneIcon,
  LoyaltyCardTexture,
  LoyaltyFoilEffect,
  LoyaltyFontFamily,
} from '@/types/loyalty-card';
import {
  LOYALTY_CARD_PRESETS,
  LOYALTY_DIMENSIONS,
  LOYALTY_SLOT_OPTIONS,
  DEFAULT_LOYALTY_TEMPLATE,
} from '@/lib/constants/loyalty-card-presets';
import { LoyaltyCardService } from '@/lib/services/loyalty-card.service';
import { LoyaltyCardView } from '@/components/loyalty/LoyaltyCardView';
import {
  Sparkles,
  CreditCard,
  Check,
  Save,
  Plus,
  Trash2,
  Gift,
  Coffee,
  Palette,
  Layers,
  Crown,
  Tag,
  Copy,
  Sliders,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface LoyaltyStudioTabProps {
  cafeSlug?: string;
  brandName?: string;
  brandLogoUrl?: string;
}

export const LoyaltyStudioTab: React.FC<LoyaltyStudioTabProps> = ({
  cafeSlug = 'espresso-lab',
  brandName = 'Memories Cafe',
  brandLogoUrl,
}) => {
  // Load saved template or fallback to default preset
  const [template, setTemplate] = useState<LoyaltyCardTemplate>(() =>
    LoyaltyCardService.getTemplateForCafe(cafeSlug)
  );

  const [activePresetId, setActivePresetId] = useState<string>(template.id);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'dimensions' | 'milestones' | 'styling'>('presets');

  // New milestone draft inputs
  const [newMilestoneSlot, setNewMilestoneSlot] = useState<number>(5);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneIcon, setNewMilestoneIcon] = useState<LoyaltyMilestoneIcon>('gift');
  const [newMilestoneIsGrand, setNewMilestoneIsGrand] = useState<boolean>(false);

  // Sync when template changes externally
  useEffect(() => {
    const handleTemplateUpdate = (e: any) => {
      if (e.detail) {
        setTemplate(e.detail);
        setActivePresetId(e.detail.id);
      }
    };
    window.addEventListener('memories-loyalty-template-updated', handleTemplateUpdate);
    return () => window.removeEventListener('memories-loyalty-template-updated', handleTemplateUpdate);
  }, []);

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = LOYALTY_CARD_PRESETS[presetId];
    if (preset) {
      setTemplate({
        ...preset,
        nameAr: preset.nameAr,
        dimensions: LOYALTY_DIMENSIONS[preset.dimensionType],
      });
      setActivePresetId(presetId);
    }
  };

  // Dimensions Selection
  const handleSelectDimension = (dimType: LoyaltyCardDimensionType) => {
    setTemplate((prev) => ({
      ...prev,
      dimensionType: dimType,
      dimensions: LOYALTY_DIMENSIONS[dimType],
    }));
  };

  // Slot Count Selection
  const handleSelectSlotCount = (count: LoyaltySlotCount) => {
    setTemplate((prev) => {
      // Filter out milestones that exceed the new slot count
      const validMilestones = prev.milestones.filter((m) => m.slot <= count);
      // Ensure there's at least a completion milestone at the end
      const hasFinalMilestone = validMilestones.some((m) => m.slot === count);
      const updatedMilestones = hasFinalMilestone
        ? validMilestones
        : [
            ...validMilestones,
            {
              slot: count,
              rewardTitle: 'مكافأة اكتمال البطاقة',
              rewardTitleEn: 'Completion Reward',
              icon: 'gift' as LoyaltyMilestoneIcon,
              discountPercent: 100,
              isGrandPrize: true,
            },
          ];

      return {
        ...prev,
        slotCount: count,
        milestones: updatedMilestones,
      };
    });
  };

  // Milestone Add
  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;

    const existingIndex = template.milestones.findIndex((m) => m.slot === newMilestoneSlot);
    const newMilestone: LoyaltyMilestone = {
      slot: newMilestoneSlot,
      rewardTitle: newMilestoneTitle.trim(),
      rewardTitleEn: 'Special Reward',
      icon: newMilestoneIcon,
      discountPercent: 100,
      codePrefix: 'GIFT',
      isGrandPrize: newMilestoneIsGrand || newMilestoneSlot === template.slotCount,
    };

    let updatedMilestones = [...template.milestones];
    if (existingIndex >= 0) {
      updatedMilestones[existingIndex] = newMilestone;
    } else {
      updatedMilestones.push(newMilestone);
    }
    updatedMilestones.sort((a, b) => a.slot - b.slot);

    setTemplate((prev) => ({ ...prev, milestones: updatedMilestones }));
    setNewMilestoneTitle('');
  };

  // Milestone Remove
  const handleRemoveMilestone = (slotToRemove: number) => {
    setTemplate((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.slot !== slotToRemove),
    }));
  };

  // Theme Update Helper
  const handleThemeUpdate = (key: string, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  // Save changes
  const handleSave = () => {
    LoyaltyCardService.saveTemplateForCafe(cafeSlug, template);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Copy customer card direct link
  const handleCopyCustomerLink = () => {
    const url = `${window.location.origin}/c/${cafeSlug}?tab=loyalty`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>استوديو بطاقات الولاء الرقمية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                  Milestone Engine
                </span>
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                تخصيص مقاسات البطاقة (ISO 7810)، عدد خانات الأختام، المكافآت المرحلية والمظهر البصري
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleCopyCustomerLink}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'رابط كارت العميل'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 md:flex-initial px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'تم الحفظ بنجاح!' : 'حفظ إعدادات البطاقة'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Configurator / Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Controls & Customization Panels (7 cols)                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tab Navigation */}
          <div className="bg-white rounded-2xl p-1.5 border border-stone-200 flex gap-1 shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('presets')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'presets'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>القوالب الجاهزة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('dimensions')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dimensions'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>المقاس والخانات ({template.slotCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('milestones')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'milestones'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>المكافآت المرحلية ({template.milestones.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('styling')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'styling'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>المظهر والألوان</span>
            </button>
          </div>

          {/* Tab 1: Presets Selector */}
          {activeSubTab === 'presets' && (
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-stone-900">اختر قالباً أصيلاً لعلامتك التجارية</h3>
                <p className="text-xs text-stone-500">
                  4+ قوالب متقنة بأبعاد المحفظة أو البطاقة المربعة أو شريط التصوير
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(LOYALTY_CARD_PRESETS).map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-900 text-white font-mono">
                            {preset.dimensions.nameAr.split(' ')[0]}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-black">
                              •
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-stone-900">{preset.nameAr}</h4>
                        <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                          {preset.descriptionAr}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-between text-[10px] text-stone-500">
                        <span>{preset.slotCount} خانات ختم</span>
                        <span>{preset.milestones.length} مكافآت</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Dimensions & Slot Counts */}
          {activeSubTab === 'dimensions' && (
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-6">
              {/* Dimensions Section */}
              <div>
                <h3 className="text-sm font-black text-stone-900 mb-1">
                  1. مقاس وأبعاد البطاقة (Card Dimensions)
                </h3>
                <p className="text-xs text-stone-500 mb-3">
                  تطابق بطاقات محفظة آبل وجوجل القياسية أو النمط المربع أو شريط كشك التصوير
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(LOYALTY_DIMENSIONS) as LoyaltyCardDimensionType[]).map((dimKey) => {
                    const dim = LOYALTY_DIMENSIONS[dimKey];
                    const isSelected = template.dimensionType === dimKey;
                    return (
                      <div
                        key={dimKey}
                        onClick={() => handleSelectDimension(dimKey)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-black text-stone-800">
                            {dim.widthMm} × {dim.heightMm} mm
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <h4 className="font-bold text-xs text-stone-900">{dim.nameAr}</h4>
                        <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                          {dim.descriptionAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slot Count Section */}
              <div className="border-t border-stone-100 pt-5">
                <h3 className="text-sm font-black text-stone-900 mb-1">
                  2. عدد خانات الأختام (Total Stamp Slots)
                </h3>
                <p className="text-xs text-stone-500 mb-3">
                  حدد عدد الزيارات اللازمة لاكتمال الدورة (4 أو 6 أو 8 أو 10 أو 12 خانة)
                </p>

                <div className="grid grid-cols-5 gap-2.5">
                  {LOYALTY_SLOT_OPTIONS.map((slots) => {
                    const isSelected = template.slotCount === slots;
                    return (
                      <button
                        key={slots}
                        type="button"
                        onClick={() => handleSelectSlotCount(slots)}
                        className={`py-3 px-2 rounded-2xl border-2 font-black transition flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-stone-900 text-amber-400 shadow-sm'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-base font-mono">{slots}</span>
                        <span className="text-[9px] font-medium opacity-80">خانات</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl mt-3 font-medium">
                  ملاحظة: 6 خانات تمنح العميل حافزاً سريعاً، بينما 10 خانات هي المعيار الذهبي لكافيهات القهوة المختصة.
                </p>
              </div>

              {/* Card Badge & Tagline */}
              <div className="border-t border-stone-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    شارة الفئة (Badge Text)
                  </label>
                  <input
                    type="text"
                    value={template.badgeTextAr || template.badgeText || ''}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        badgeTextAr: e.target.value,
                        badgeText: e.target.value,
                      }))
                    }
                    placeholder="مثال: عضوية VIP"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الشعار الفرعي (Tagline)
                  </label>
                  <input
                    type="text"
                    value={template.taglineAr || template.tagline || ''}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        taglineAr: e.target.value,
                        tagline: e.target.value,
                      }))
                    }
                    placeholder="مثال: برنامج ولاء القهوة المختصة"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Milestones Manager */}
          {activeSubTab === 'milestones' && (
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  محرك المكافآت المرحلية (Milestones Engine)
                </h3>
                <p className="text-xs text-stone-500">
                  كافئ العميل في منتصف الطريق وعند اكتمال البطاقة لتحفيز تكرار الزيارات
                </p>
              </div>

              {/* Existing Milestones List */}
              <div className="space-y-2.5">
                {template.milestones.map((m) => (
                  <div
                    key={m.slot}
                    className="p-3 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-mono font-black text-xs">
                        #{m.slot}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                          <span>{m.rewardTitle}</span>
                          {m.isGrandPrize && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                              الجائزة الكبرى
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-stone-500">
                          {m.rewardDescription || `تُمنح تلقائياً عند الوصول للختم رقم ${m.slot}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.slot)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="حذف المكافأة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>إضافة مكافأة مرحلية جديدة</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      عند الختم رقم
                    </label>
                    <select
                      value={newMilestoneSlot}
                      onChange={(e) => setNewMilestoneSlot(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      {Array.from({ length: template.slotCount }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          الختم #{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      عنوان الهدية أو الخصم
                    </label>
                    <input
                      type="text"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      placeholder="مثال: قطعة دونات مجانية أو خصم 50%"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={newMilestoneIsGrand}
                      onChange={(e) => setNewMilestoneIsGrand(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>تمييز كـ (الجائزة الكبرى للبطاقة)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    disabled={!newMilestoneTitle.trim()}
                    className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    حفظ المكافأة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Theme & Visual Styling */}
          {activeSubTab === 'styling' && (
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  تخصيص المظهر، الخامات ورقائق المعادن
                </h3>
                <p className="text-xs text-stone-500">
                  تحكم في ملمس البطاقة، توهج الأختام وتأثيرات الانعكاس
                </p>
              </div>

              {/* Texture & Material Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  خامة البطاقة (Card Texture)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['leather', 'kraft', 'neon', 'botanical'] as LoyaltyCardTexture[]).map((tex) => (
                    <button
                      key={tex}
                      type="button"
                      onClick={() => handleThemeUpdate('texture', tex)}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition capitalize cursor-pointer ${
                        template.theme.texture === tex
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {tex === 'leather'
                        ? 'جلد فاخر'
                        : tex === 'kraft'
                        ? 'ورق كرافت'
                        : tex === 'neon'
                        ? 'نيون سايبر'
                        : 'أوراق نباتية'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foil Effect */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  تأثير رقائق المعادن واللمعان (Foil Accent Effect)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bronze', 'gold', 'neon', 'none'] as LoyaltyFoilEffect[]).map((foil) => (
                    <button
                      key={foil}
                      type="button"
                      onClick={() => handleThemeUpdate('foilEffect', foil)}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition capitalize cursor-pointer ${
                        template.theme.foilEffect === foil
                          ? 'border-amber-500 bg-stone-900 text-amber-400 shadow-xs'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {foil === 'bronze'
                        ? 'برونز ميتاليك'
                        : foil === 'gold'
                        ? 'ذهب فاخر'
                        : foil === 'neon'
                        ? 'توهج نيون'
                        : 'بدون بريق'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customization Palette */}
              <div className="border-t border-stone-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    لون النص الأساسي
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.textColor.startsWith('#') ? template.theme.textColor : '#FFFFFF'}
                      onChange={(e) => handleThemeUpdate('textColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-stone-700">{template.theme.textColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    لون التمييز (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.accentColor.startsWith('#') ? template.theme.accentColor : '#D4AF37'}
                      onChange={(e) => handleThemeUpdate('accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-stone-700">{template.theme.accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    إطار الختم النشط
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.stampBorderColor.startsWith('#') ? template.theme.stampBorderColor : '#8C683A'}
                      onChange={(e) => handleThemeUpdate('stampBorderColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-stone-700">{template.theme.stampBorderColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    خط البطاقة (Font)
                  </label>
                  <select
                    value={template.theme.fontFamily}
                    onChange={(e) => handleThemeUpdate('fontFamily', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="cairo">Cairo (عصري)</option>
                    <option value="tajawal">Tajawal (أنيق)</option>
                    <option value="sans">System Sans</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Interactive Live Card Preview (5 cols)                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col items-center">
            {/* Dimension Badge Header */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>معاينة حية تفاعلية</span>
              </span>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                {template.dimensions.widthMm} × {template.dimensions.heightMm} mm
              </span>
            </div>

            {/* Tactile 3D Card View */}
            <div className="w-full py-2 flex items-center justify-center">
              <LoyaltyCardView
                template={template}
                brandName={brandName}
                brandLogoUrl={brandLogoUrl}
                customerName="ضيف الكافيه"
                customerPhone=""
                interactive={true}
              />
            </div>

            {/* Quick Tips */}
            <p className="text-[10px] text-stone-400 text-center mt-3 leading-relaxed">
              اضغط على الأختام لتجربة نغمة الرنين (WebAudio Chime) أو اقلب البطاقة لعرض باركود الباريستا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
