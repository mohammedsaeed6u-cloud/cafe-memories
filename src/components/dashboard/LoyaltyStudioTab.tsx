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
  cafeSlug = 'memories',
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
      <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-bold shadow-md border border-white/10">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
                <span>استوديو بطاقات الولاء الرقمية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#55100D] text-[#FBF9F5] font-bold border border-[#DD0200]/30 font-mono">
                  Milestone Engine
                </span>
              </h2>
              <p className="text-xs text-[#A19E9B]">
                تخصيص مقاسات البطاقة (ISO 7810)، عدد خانات الأختام، المكافآت المرحلية والمظهر البصري
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleCopyCustomerLink}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold flex items-center justify-center gap-1.5 transition border border-white/10 cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#A19E9B]" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'رابط كارت العميل'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 md:flex-initial px-5 py-2 rounded-xl bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center justify-center gap-2 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
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
          <div className="bg-[#141212] rounded-xl p-1.5 border border-white/10 flex gap-1 shadow-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('presets')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'presets'
                  ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>القوالب الجاهزة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('dimensions')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dimensions'
                  ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>المقاس والخانات ({template.slotCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('milestones')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'milestones'
                  ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>المكافآت المرحلية ({template.milestones.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('styling')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'styling'
                  ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>المظهر والألوان</span>
            </button>
          </div>

          {/* Tab 1: Presets Selector */}
          {activeSubTab === 'presets' && (
            <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#FBF9F5] font-serif">اختر قالباً أصيلاً لعلامتك التجارية</h3>
                <p className="text-xs text-[#A19E9B]">
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
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#DD0200] bg-[#55100D]/30 shadow-lg ring-1 ring-[#DD0200]'
                          : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0B0A0A] text-[#FBF9F5] border border-white/10">
                            {preset.dimensions.nameAr.split(' ')[0]}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#DD0200] text-white flex items-center justify-center text-xs font-black shadow-sm">
                              •
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[#FBF9F5] font-serif">{preset.nameAr}</h4>
                        <p className="text-[11px] text-[#A19E9B] mt-1 leading-relaxed">
                          {preset.descriptionAr}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-[#A19E9B]">
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
            <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl space-y-6">
              {/* Dimensions Section */}
              <div>
                <h3 className="text-sm font-bold text-[#FBF9F5] font-serif mb-1">
                  1. مقاس وأبعاد البطاقة (Card Dimensions)
                </h3>
                <p className="text-xs text-[#A19E9B] mb-3">
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
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-[#DD0200] bg-[#55100D]/30 shadow-md ring-1 ring-[#DD0200]'
                            : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-[#FBF9F5]">
                            {dim.widthMm} × {dim.heightMm} mm
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#DD0200]" />}
                        </div>
                        <h4 className="font-bold text-xs text-[#FBF9F5] font-serif">{dim.nameAr}</h4>
                        <p className="text-[10px] text-[#A19E9B] mt-1 leading-snug">
                          {dim.descriptionAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slot Count Section */}
              <div className="border-t border-white/10 pt-5">
                <h3 className="text-sm font-bold text-[#FBF9F5] font-serif mb-1">
                  2. عدد خانات الأختام (Total Stamp Slots)
                </h3>
                <p className="text-xs text-[#A19E9B] mb-3">
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
                        className={`py-3 px-2 rounded-xl border font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'border-[#DD0200] bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                            : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#252424]'
                        }`}
                      >
                        <span className="text-base font-mono">{slots}</span>
                        <span className="text-[9px] font-medium opacity-80">خانات</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#FBF9F5] bg-[#55100D]/40 p-2.5 rounded-xl mt-3 font-medium border border-[#DD0200]/30">
                  ملاحظة: 6 خانات تمنح العميل حافزاً سريعاً، بينما 10 خانات هي المعيار الذهبي لبرامج المكافآت الدورية.
                </p>
              </div>

              {/* Card Badge & Tagline */}
              <div className="border-t border-white/10 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 focus:outline-none focus:ring-1 focus:ring-[#DD0200]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A19E9B] mb-1">
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
                    placeholder="مثال: برنامج الولاء والمكافآت الحصرية"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 focus:outline-none focus:ring-1 focus:ring-[#DD0200]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Milestones Manager */}
          {activeSubTab === 'milestones' && (
            <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#FBF9F5] font-serif">
                  محرك المكافآت المرحلية (Milestones Engine)
                </h3>
                <p className="text-xs text-[#A19E9B]">
                  كافئ العميل في منتصف الطريق وعند اكتمال البطاقة لتحفيز تكرار الزيارات
                </p>
              </div>

              {/* Existing Milestones List */}
              <div className="space-y-2.5">
                {template.milestones.map((m) => (
                  <div
                    key={m.slot}
                    className="p-3 rounded-xl border border-white/10 bg-[#1C1B1B] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#55100D] border border-[#DD0200]/30 text-[#FBF9F5] flex items-center justify-center font-mono font-bold text-xs">
                        #{m.slot}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[#FBF9F5] flex items-center gap-1.5 font-serif">
                          <span>{m.rewardTitle}</span>
                          {m.isGrandPrize && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DD0200] text-white font-bold">
                              الجائزة الكبرى
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-[#A19E9B]">
                          {m.rewardDescription || `تُمنح تلقائياً عند الوصول للختم رقم ${m.slot}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.slot)}
                      className="p-1.5 rounded-lg text-[#A19E9B] hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                      title="حذف المكافأة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone Card */}
              <div className="bg-[#1C1B1B]/70 rounded-xl p-4 border border-white/10 space-y-3">
                <h4 className="font-bold text-xs text-[#FBF9F5] flex items-center gap-1.5 font-serif">
                  <Plus className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>إضافة مكافأة مرحلية جديدة</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                      عند الختم رقم
                    </label>
                    <select
                      value={newMilestoneSlot}
                      onChange={(e) => setNewMilestoneSlot(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:outline-none focus:ring-1 focus:ring-[#DD0200]"
                    >
                      {Array.from({ length: template.slotCount }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          الختم #{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                      عنوان الهدية أو الخصم
                    </label>
                    <input
                      type="text"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      placeholder="مثال: قطعة دونات مجانية أو خصم 50%"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 focus:outline-none focus:ring-1 focus:ring-[#DD0200]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#A19E9B]">
                    <input
                      type="checkbox"
                      checked={newMilestoneIsGrand}
                      onChange={(e) => setNewMilestoneIsGrand(e.target.checked)}
                      className="rounded accent-[#DD0200]"
                    />
                    <span>تمييز كـ (الجائزة الكبرى للبطاقة)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    disabled={!newMilestoneTitle.trim()}
                    className="px-4 py-1.5 bg-[#DD0200] hover:bg-[#B50200] disabled:opacity-40 text-[#FBF9F5] rounded-xl text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
                  >
                    حفظ المكافأة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Theme & Visual Styling */}
          {activeSubTab === 'styling' && (
            <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#FBF9F5] font-serif">
                  تخصيص المظهر، الخامات ورقائق المعادن
                </h3>
                <p className="text-xs text-[#A19E9B]">
                  تحكم في ملمس البطاقة، توهج الأختام وتأثيرات الانعكاس
                </p>
              </div>

              {/* Texture & Material Picker */}
              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  خامة البطاقة (Card Texture)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['leather', 'kraft', 'neon', 'botanical'] as LoyaltyCardTexture[]).map((tex) => (
                    <button
                      key={tex}
                      type="button"
                      onClick={() => handleThemeUpdate('texture', tex)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition capitalize cursor-pointer ${
                        template.theme.texture === tex
                          ? 'border-[#DD0200] bg-[#55100D]/40 text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5]'
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
                <label className="block text-xs font-bold text-[#A19E9B] mb-2">
                  تأثير رقائق المعادن واللمعان (Foil Accent Effect)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bronze', 'gold', 'neon', 'none'] as LoyaltyFoilEffect[]).map((foil) => (
                    <button
                      key={foil}
                      type="button"
                      onClick={() => handleThemeUpdate('foilEffect', foil)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition capitalize cursor-pointer ${
                        template.theme.foilEffect === foil
                          ? 'border-[#DD0200] bg-[#55100D]/40 text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5]'
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
              <div className="border-t border-white/10 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                    لون النص الأساسي
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.textColor.startsWith('#') ? template.theme.textColor : '#FFFFFF'}
                      onChange={(e) => handleThemeUpdate('textColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-[#FBF9F5]">{template.theme.textColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                    لون التمييز (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.accentColor.startsWith('#') ? template.theme.accentColor : '#D4AF37'}
                      onChange={(e) => handleThemeUpdate('accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-[#FBF9F5]">{template.theme.accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                    إطار الختم النشط
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.theme.stampBorderColor.startsWith('#') ? template.theme.stampBorderColor : '#8C683A'}
                      onChange={(e) => handleThemeUpdate('stampBorderColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-[#FBF9F5]">{template.theme.stampBorderColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                    خط البطاقة (Font)
                  </label>
                  <select
                    value={template.theme.fontFamily}
                    onChange={(e) => handleThemeUpdate('fontFamily', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5]"
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
          <div className="bg-[#141212] rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col items-center">
            {/* Dimension Badge Header */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4 text-[#DD0200]" />
                <span>معاينة حية تفاعلية</span>
              </span>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#1C1B1B] text-[#A19E9B] font-bold border border-white/10">
                {template.dimensions.widthMm} × {template.dimensions.heightMm} mm
              </span>
            </div>

            {/* Tactile 3D Card View */}
            <div className="w-full py-2 flex items-center justify-center">
              <LoyaltyCardView
                template={template}
                brandName={brandName}
                brandLogoUrl={brandLogoUrl}
                customerName="ضيف مميز"
                customerPhone=""
                interactive={true}
              />
            </div>

            {/* Quick Tips */}
            <p className="text-[10px] text-[#A19E9B] text-center mt-3 leading-relaxed">
              اضغط على الأختام لتجربة نغمة الرنين (WebAudio Chime) أو اقلب البطاقة لعرض باركود الكاونتر والموظفين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
