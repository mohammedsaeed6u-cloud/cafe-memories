'use client';

import React from 'react';
import { Lock, Check } from 'lucide-react';
import { PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioThemesSection: React.FC<Props> = ({ studio }) => {
  const {
    lockFrameForCustomers,
    setLockFrameForCustomers,
    selectedTemplateId,
    activeFrame,
    handleSelectTemplate,
  } = studio;

  return (
    <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
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
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#d97706]" />
          <span>هويات أصلية</span>
        </span>
      </div>

      {/* Strict Frame Enforcement Toggle */}
      <div
        className={`p-4 rounded-xl border transition-all mb-4 ${
          lockFrameForCustomers
            ? 'bg-[#b45309]/30 border-[#d97706]/40 ring-1 ring-[#d97706]/40'
            : 'bg-[#1C1B1B]/70 border-white/10'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                lockFrameForCustomers ? 'bg-[#d97706] text-white' : 'bg-[#1C1B1B] text-[#A19E9B]'
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
                      ? 'bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/40'
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
            <div className="w-11 h-6 bg-[#1C1B1B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d97706]"></div>
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
                  ? 'border-[#d97706] bg-[#b45309]/30 shadow-md ring-1 ring-[#d97706]'
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
                  {isSelected && <Check className="w-4 h-4 text-[#d97706] shrink-0" />}
                </div>

                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#0B0A0A] text-[#FBF9F5] rounded-md border border-white/10">
                    {tmpl.dimensions} ({tmpl.dimensionsCm})
                  </span>
                  <span className="text-[10px] font-bold text-[#d97706]">
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
  );
};
