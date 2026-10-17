'use client';

import React from 'react';
import { Sliders, ExternalLink, CheckCircle } from 'lucide-react';

interface Props {
  onOpenQuickSetup: () => void;
  saveSuccess: boolean;
}

export const SettingsHeaderBanner: React.FC<Props> = ({
  onOpenQuickSetup,
  saveSuccess,
}) => {
  return (
    <>
      <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#c92a54]" />
            <h3 className="font-bold text-base text-[#FBF9F5]" style={{ fontFamily: 'var(--font-jakarta), var(--font-cairo), sans-serif' }}>
              إعدادات وهوية المنشأة والمشروع
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-mono font-bold">
              VERIFIED ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            تحكم كامل في هوية علامتك التجارية، استوديو أختام الولاء المخصصة، وبث الإشعارات الحية لشاشات قفل الهواتف.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickSetup}
          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#FBF9F5] font-bold text-xs border border-[rgba(255,255,255,0.1)] transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-800" />
          <span>معالج الإعداد السريع للـ QR</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ الإعدادات وتطبيق تصميم الختم وهوية المنشأة بنجاح عبر كافة كروت العملاء والمحفظة!</span>
        </div>
      )}
    </>
  );
};
