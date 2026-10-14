'use client';

import React from 'react';
import { Sliders } from 'lucide-react';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioBorderRadiusSection: React.FC<Props> = ({ studio }) => {
  const {
    borderRadius,
    frameShape,
    handleSelectFrameShape,
    handleBorderRadiusChange,
  } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleSelectFrameShape('sharp')}
            className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
              borderRadius === 0
                ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] ring-1 ring-[#d97706]'
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
                ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] ring-1 ring-[#d97706]'
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
                ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] ring-1 ring-[#d97706]'
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
                ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] ring-1 ring-[#d97706]'
                : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
            }`}
          >
            <span className="text-xs block font-bold">ذقن بولارويد</span>
            <span className="text-[10px] text-[#A19E9B]">كاميرا فورية</span>
          </button>
        </div>

        <div className="p-3.5 bg-[#0B0A0A] rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#d97706]" />
              <span>التحكم الدقيق في درجة الاستدارة (Border Radius Slider):</span>
            </label>
            <span className="text-xs font-mono font-bold text-[#d97706]">{borderRadius} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            step="1"
            value={borderRadius}
            onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value, 10))}
            className="w-full accent-[#d97706] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#A19E9B] font-mono mt-1">
            <span>0px (حواف مستقيمة حادة)</span>
            <span>16px (افتراضي)</span>
            <span>32px (حواف دائرية بالكامل)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
