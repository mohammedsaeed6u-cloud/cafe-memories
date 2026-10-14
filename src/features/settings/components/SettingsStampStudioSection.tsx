'use client';

import React from 'react';
import { Award, Image as ImageIcon, Smile, Sparkles } from 'lucide-react';
import { CURATED_STAMP_EMOJIS, INK_PALETTES, STAMP_SHAPES, UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsStampStudioSection: React.FC<Props> = ({ vm }) => {
  const {
    stampType,
    setStampType,
    stampLogoUrl,
    setStampLogoUrl,
    logoUrl,
    knockoutLogo,
    setKnockoutLogo,
    customEmoji,
    setCustomEmoji,
    inkColor,
    setInkColor,
    stampShape,
    setStampShape,
  } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-5">
      <div className="pb-3 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-800" />
            <h4 className="font-bold text-sm text-[#FBF9F5]" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              4. استوديو تخصيص الختم للمشروع (Bespoke Stamp Studio)
            </h4>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            حدد شكل وطابع الختم الذي يوضع على كارت العميل: شعار المنشأة مفرغ كختم حبر كلاسيكي، أو أيقونة إيموجي مميزة.
          </p>
        </div>
        <span className="text-[11px] font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          تخصيص كامل لكل مشروع
        </span>
      </div>

      {/* Stamp Type Selector */}
      <div>
        <label className="block text-xs font-bold text-stone-700 mb-2">
          نوع الختم المعتمد على الكارت:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStampType('logo')}
            className={`p-4 rounded-2xl border text-right transition flex items-start gap-3 cursor-pointer ${
              stampType === 'logo'
                ? 'border-amber-800 bg-amber-50/70 shadow-xs ring-1 ring-amber-800/20'
                : 'border-[rgba(255,255,255,0.1)] bg-[#141212] hover:bg-[#0B0A0A]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-xs font-bold block text-[#FBF9F5]">ختم شعار المنشأة (مفرغ بالحبر)</strong>
              <span className="text-[11px] text-stone-500">لوجو المنشأة يُفرغ ويُطبع كختم حبر كلاسيكي أنيق</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStampType('emoji')}
            className={`p-4 rounded-2xl border text-right transition flex items-start gap-3 cursor-pointer ${
              stampType === 'emoji'
                ? 'border-amber-800 bg-amber-50/70 shadow-xs ring-1 ring-amber-800/20'
                : 'border-[rgba(255,255,255,0.1)] bg-[#141212] hover:bg-[#0B0A0A]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
              <Smile className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-xs font-bold block text-[#FBF9F5]">أيقونة إيموجي مخصصة للمشروع</strong>
              <span className="text-[11px] text-stone-500">رمز تعبيري مميز يختاره كل مشروع ليكون ختمه المعتمد</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic Controls per Stamp Type */}
      <div className="p-4 rounded-2xl bg-[#141212] border border-[rgba(255,255,255,0.1)] space-y-4">
        {stampType === 'logo' && (
          <div className="space-y-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                رابط لوجو الختم المباشر (PNG أو SVG):
              </label>
              <input
                type="url"
                dir="ltr"
                value={stampLogoUrl}
                onChange={(e) => setStampLogoUrl(e.target.value)}
                placeholder="https://example.com/stamp-logo.png"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-white text-[#FBF9F5] font-mono focus:outline-none focus:border-[#c92a54]"
              />
            </div>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#141212] border border-[rgba(255,255,255,0.1)] cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[#FBF9F5] block">تفريغ الشعار كختم حبر كلاسيكي (Knockout Silhouette)</span>
                <span className="text-[10px] text-stone-500">يعزل الشعار ليظهر كطبعة ختم حقيقية بالحبر المختار.</span>
              </div>
              <input
                type="checkbox"
                checked={knockoutLogo}
                onChange={(e) => setKnockoutLogo(e.target.checked)}
                className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
              />
            </label>
          </div>
        )}

        {stampType === 'emoji' && (
          <div className="space-y-3 animate-in fade-in">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              اختر الأيقونة الخاصة بمشروعك:
            </label>
            <div className="flex flex-wrap gap-2">
              {CURATED_STAMP_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCustomEmoji(em)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition cursor-pointer ${
                    customEmoji === em
                      ? 'bg-amber-100 border-2 border-amber-800 shadow-xs scale-110'
                      : 'bg-[#141212] border border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-stone-500">أو اكتب إيموجي مخصص:</span>
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-16 px-2 py-1 text-center text-sm rounded-lg border border-[rgba(255,255,255,0.1)] bg-white focus:outline-none focus:border-[#c92a54]"
              />
            </div>
          </div>
        )}

        {/* Ink Color & Seal Shape Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[rgba(255,255,255,0.1)]/80">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              لون حبر الختم (Ink Tone):
            </label>
            <div className="flex flex-wrap gap-2">
              {INK_PALETTES.map((ink) => (
                <button
                  key={ink.id}
                  type="button"
                  onClick={() => setInkColor(ink.hex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    inkColor === ink.hex
                      ? 'border-amber-900 bg-white shadow-xs font-black'
                      : 'border-transparent bg-white/70 hover:bg-white text-stone-600'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: ink.hex }}
                  />
                  <span>{ink.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              إطار شكل الختم:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAMP_SHAPES.map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => setStampShape(sh.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-right flex items-center gap-1.5 transition cursor-pointer border ${
                    stampShape === sh.id
                      ? 'border-amber-800 bg-white font-bold text-[#FBF9F5] shadow-xs'
                      : 'border-[rgba(255,255,255,0.1)] bg-white/60 hover:bg-white text-stone-600'
                  }`}
                >
                  <span>{sh.icon}</span>
                  <span className="text-[11px] truncate">{sh.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Stamp Preview Dock */}
      <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <span className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5 justify-center sm:justify-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>معاينة حية لشكل الختم على خانة كارت العميل</span>
          </span>
          <p className="text-[11px] text-stone-500">
            هكذا يظهر الختم على هاتف العميل وفي المحفظة الرقمية فور قيام الموظف بختم الزيارة.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white px-5 py-3 rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-mono text-stone-400">
              1
            </div>
            <span className="text-[9px] text-stone-500 font-medium">الخانة فارغة</span>
          </div>

          <div className="text-amber-800 font-bold text-xs">➔</div>

          <div className="flex flex-col items-center gap-1">
            <div
              style={{
                backgroundColor: `${inkColor}15`,
                borderColor: `${inkColor}60`,
              }}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-xs scale-105 transition-all overflow-hidden p-1.5 ${
                stampShape === 'square' ? 'rounded-md' : stampShape === 'vintage_seal' ? 'rounded-2xl border-dashed' : 'rounded-xl'
              }`}
            >
              {stampType === 'logo' && (stampLogoUrl || logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stampLogoUrl || logoUrl}
                  alt="شعار الختم"
                  className="w-full h-full object-contain"
                  style={{
                    filter: knockoutLogo ? 'grayscale(100%) contrast(150%)' : undefined,
                  }}
                />
              ) : (
                <span className="text-xl animate-in zoom-in-50">{customEmoji || '☕'}</span>
              )}
            </div>
            <span className="text-[9px] text-amber-900 font-bold">مختومة بالزيارة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
