'use client';

import React from 'react';
import { PRESET_EMOJI_PAIRS } from '@/lib/constants/photobooth-presets';
import { UseFrameStudioReturn } from '../types';

interface Props {
  studio: UseFrameStudioReturn;
}

export const FrameStudioRewardAndCornersSection: React.FC<Props> = ({ studio }) => {
  const {
    freeGift,
    setFreeGift,
    activeFrame,
    setActiveFrame,
    handleSelectEmojiPair,
  } = studio;

  return (
    <>
      {/* Section 6: Reward on the Last Slot */}
      <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
            6
          </div>
          <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
            هدية وجائزة الخانة الأخيرة في الكارت
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
              اسم الهدية (تظهر داخل الخانة الأخيرة في شريط العميل)
            </label>
            <input
              type="text"
              value={freeGift.title}
              onChange={(e) => setFreeGift({ ...freeGift, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
              placeholder="مثلاً: مشروب مجاني مميز + طباعة الكارت"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
              شرح الاستلام لطاقم العمل أو موظف الكاونتر
            </label>
            <input
              type="text"
              value={freeGift.subtitle}
              onChange={(e) => setFreeGift({ ...freeGift, subtitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
              placeholder="يظهر لطاقم الخدمة لتسليم الهدية وطباعة الشريط الورقي"
            />
          </div>
        </div>
      </div>

      {/* Section 7: Corner Emojis */}
      <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#b45309] text-[#FBF9F5] border border-[#d97706]/30 flex items-center justify-center font-bold">
              7
            </div>
            <h3 className="font-bold text-[#FBF9F5] text-base font-serif">
              ستيكرز الزوايا (Corner Emojis)
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#FBF9F5] cursor-pointer">
            <input
              type="checkbox"
              checked={activeFrame.cornerEmojis?.enabled ?? true}
              onChange={(e) =>
                setActiveFrame({
                  ...activeFrame,
                  cornerEmojis: {
                    ...activeFrame.cornerEmojis,
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded text-[#d97706] bg-[#141212] border-white/20 focus:ring-[#d97706] cursor-pointer"
            />
            <span>تفعيل الستيكرز</span>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {PRESET_EMOJI_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectEmojiPair(pair.topRight, pair.bottomLeft)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                activeFrame.cornerEmojis?.topRight === pair.topRight &&
                activeFrame.cornerEmojis?.bottomLeft === pair.bottomLeft
                  ? 'border-[#d97706] bg-[#b45309]/30 font-bold text-[#FBF9F5] ring-1 ring-[#d97706]'
                  : 'border-white/10 hover:border-white/20 bg-[#1C1B1B]/70 hover:bg-[#1C1B1B] text-[#A19E9B]'
              }`}
            >
              <span>{pair.label}</span>
              <span className="text-base">
                {pair.bottomLeft} {pair.topRight}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div>
            <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
              إيموجي أعلى اليمين:
            </label>
            <input
              type="text"
              value={activeFrame.cornerEmojis?.topRight || ''}
              onChange={(e) =>
                setActiveFrame({
                  ...activeFrame,
                  cornerEmojis: {
                    ...activeFrame.cornerEmojis,
                    topRight: e.target.value,
                    enabled: true,
                  },
                })
              }
              className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-white/10 focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
              إيموجي أسفل اليسار:
            </label>
            <input
              type="text"
              value={activeFrame.cornerEmojis?.bottomLeft || ''}
              onChange={(e) =>
                setActiveFrame({
                  ...activeFrame,
                  cornerEmojis: {
                    ...activeFrame.cornerEmojis,
                    bottomLeft: e.target.value,
                    enabled: true,
                  },
                })
              }
              className="w-full text-center text-xl py-1.5 px-2 rounded-xl border border-white/10 focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5]"
            />
          </div>
        </div>
      </div>
    </>
  );
};
