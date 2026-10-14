'use client';

import React from 'react';
import { Save, Check } from 'lucide-react';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioSaveButton: React.FC<Props> = ({ studio }) => {
  const { handleSaveAll, isSavedNotice, activeFrame, widthCm, heightCm } = studio;

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={handleSaveAll}
        className="w-full py-4 px-6 rounded-2xl bg-[#d97706] hover:bg-[#b00200] text-[#FBF9F5] font-black text-base shadow-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-2xl transition flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
      >
        <Save className="w-5 h-5 text-white" />
        <span>حفظ الإعدادات وتطبيقها فوراً على كروت العملاء</span>
      </button>

      {isSavedNotice && (
        <div className="mt-3 p-3.5 bg-[#b45309]/40 border border-[#d97706]/40 text-[#FBF9F5] text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 animate-in fade-in shadow-xs">
          <Check className="w-4 h-4 text-[#d97706]" />
          <span>
            تم حفظ وتطبيق مقاس الكارت ({activeFrame.shotCount} صور)، أبعاده ({widthCm}×{heightCm} سم)، هويته وثيم ألوانه بنجاح!
          </span>
        </div>
      )}
    </div>
  );
};
