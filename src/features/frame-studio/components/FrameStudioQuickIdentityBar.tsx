'use client';

import React from 'react';
import {
  PHOTOBOOTH_FRAME_TEMPLATES,
  PRESET_COLOR_PALETTES,
} from '@/lib/constants/photobooth-presets';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioQuickIdentityBar: React.FC<Props> = ({ studio }) => {
  const {
    branding,
    setBranding,
    setIsCardFlipped,
    selectedTemplateId,
    activeFrame,
    handleSelectTemplate,
    isCustomColorMode,
    activePaletteId,
    handleSelectPalette,
  } = studio;

  return (
    <div className="p-4 rounded-2xl bg-[#141212] border border-[#d97706]/30 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
          <h3 className="text-sm font-black text-[#FBF9F5] font-serif">هوية سريعة — جرّبها فوراً قبل الحفظ</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setBranding({ ...branding, showLogo: branding.showLogo === false });
            setIsCardFlipped((v) => !v);
          }}
          title="بدّل بين وجهي الكارت: الأمامي بالخانات والخلفي بهوية المكان وشروط الهدية"
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
            branding.showLogo === false
              ? 'bg-[#1C1B1B] text-[#A19E9B] border-white/10'
              : 'bg-[#b45309]/40 text-[#FBF9F5] border-[#d97706]/40'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${branding.showLogo === false ? 'bg-[#A19E9B]' : 'bg-[#d97706]'}`}></span>
          {branding.showLogo === false ? 'لوجو: مخفي' : 'لوجو: ظاهر'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PHOTOBOOTH_FRAME_TEMPLATES.slice(0, 6).map((tmpl) => {
          const selected = (selectedTemplateId || activeFrame.templateId) === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                selected
                  ? 'border-[#d97706] bg-[#b45309]/30 text-[#FBF9F5]'
                  : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5] hover:border-white/20'
              }`}
            >
              {tmpl.icon} {tmpl.nameAr.split('(')[0].trim()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-[#A19E9B]">اللون:</span>
        {PRESET_COLOR_PALETTES.map((p) => {
          const selected = !isCustomColorMode && activePaletteId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              title={p.nameAr}
              onClick={() => handleSelectPalette(p)}
              className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                selected ? 'border-[#d97706] scale-110 shadow-md' : 'border-white/15 hover:scale-105'
              }`}
              style={{ backgroundColor: p.bgColor }}
            />
          );
        })}
        <span className="text-[10px] text-[#A19E9B] font-mono ml-1" dir="ltr">
          {activeFrame.widthCm}×{activeFrame.heightCm}cm
        </span>
      </div>
    </div>
  );
};
