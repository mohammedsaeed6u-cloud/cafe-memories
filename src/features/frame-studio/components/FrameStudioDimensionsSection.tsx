'use client';

import React from 'react';
import { Maximize2, Layout, Check } from 'lucide-react';
import { DIMENSION_PRESETS, SHOT_COUNT_OPTIONS } from '@/lib/constants/photobooth-presets';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioDimensionsSection: React.FC<Props> = ({ studio }) => {
  const {
    dimensionsPreset,
    handleSelectDimensionPreset,
    widthCm,
    heightCm,
    handleCustomDimensionChange,
    activeFrame,
    handleOrientationChange,
    handleShotCountChange,
  } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
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
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30">
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
                      ? 'border-[#d97706] bg-[#b45309]/30 font-bold ring-1 ring-[#d97706] shadow-sm'
                      : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs text-[#FBF9F5] font-serif">{preset.nameAr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#d97706] shrink-0" />}
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

        {/* Custom cm inputs */}
        <div className="p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#d97706]" />
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
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-white/10 bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none"
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
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-white/10 bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Orientation Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-[#d97706] shrink-0" />
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
                  ? 'bg-[#d97706] text-white shadow-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
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
                  ? 'bg-[#d97706] text-white shadow-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              أفقي عريض (Horizontal)
            </button>
          </div>
        </div>

        {/* Number of Photo Slots / Cuts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#FBF9F5] block">
              ب) عدد خانات الصور في الكارت (عدد الزيارات المطلوبة لاكتمال الكارت):
            </label>
            <span className="text-xs font-mono font-bold text-[#FBF9F5] bg-[#b45309] px-2 py-0.5 rounded-md border border-[#d97706]/30">
              {activeFrame.shotCount} خانات
            </span>
          </div>

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
                      ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] shadow-xs ring-1 ring-[#d97706]'
                      : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
                  }`}
                >
                  <span className="text-xs font-bold">{shotOpt.count} {shotOpt.count === 1 ? 'لقطة' : 'صور'}</span>
                  <span className="text-[9px] font-mono text-[#A19E9B]">{shotOpt.badge}</span>
                </button>
              );
            })}
          </div>

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
  );
};
