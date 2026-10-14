'use client';

import React from 'react';
import { Check, CheckSquare, Square } from 'lucide-react';
import { PRESET_COLOR_PALETTES } from '@/lib/constants/photobooth-presets';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioColorSection: React.FC<Props> = ({ studio }) => {
  const {
    activePaletteId,
    handleSelectPalette,
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
    setActiveFrame,
    allowCustomerColors,
    setAllowCustomerColors,
    allowedColorIds,
    handleToggleAllowedColor,
    allowCustomerStickers,
    setAllowCustomerStickers,
  } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
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
                      ? 'border-[#d97706] bg-[#b45309]/30 shadow-sm font-bold ring-1 ring-[#d97706]'
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
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#d97706] shrink-0" />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCustomColorMode(true)}
              className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                isCustomColorMode
                  ? 'border-[#d97706] bg-[#b45309]/30 shadow-sm font-bold ring-1 ring-[#d97706]'
                  : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#d97706] to-[#b45309] border border-white/20 shadow-xs shrink-0" />
                <span className="text-xs text-[#FBF9F5] font-serif truncate">ألوان مخصصة</span>
              </div>
              {isCustomColorMode && <Check className="w-3.5 h-3.5 text-[#d97706] shrink-0" />}
            </button>
          </div>
        </div>

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
                    className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:outline-none"
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
                    className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:outline-none"
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
                    className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:outline-none"
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
                    className="w-full text-xs font-mono p-1 border border-white/10 rounded bg-[#141212] text-[#FBF9F5] focus:border-[#d97706] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
                className="w-4 h-4 rounded text-[#d97706] bg-[#141212] border-white/20 focus:ring-[#d97706] cursor-pointer"
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
                          ? 'bg-[#1C1B1B] border-[#d97706] text-[#FBF9F5] shadow-xs'
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
                        <CheckSquare className="w-4 h-4 text-[#d97706] shrink-0" />
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

        <div className="pt-2">
          <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-[#0B0A0A] cursor-pointer hover:border-white/20 transition">
            <input
              type="checkbox"
              checked={allowCustomerStickers}
              onChange={(e) => setAllowCustomerStickers(e.target.checked)}
              className="w-4 h-4 rounded text-[#d97706] bg-[#141212] border-white/20 focus:ring-[#d97706] cursor-pointer"
            />
            <span className="font-bold text-xs text-[#FBF9F5]">السماح للعميل بإضافة وتحريك ستيكرز وإيموجيز على الكارت</span>
          </label>
        </div>
      </div>
    </div>
  );
};
