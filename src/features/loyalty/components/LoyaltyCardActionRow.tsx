'use client';

import React from 'react';
import { Share2, Download, Bell } from 'lucide-react';

export interface LoyaltyCardActionRowProps {
  onShare: () => void;
  onSaveToDevice: () => void;
  onOpenStaffStamp: () => void;
  onOpenNotificationBroadcaster?: () => void;
  isExporting: boolean;
}

export const LoyaltyCardActionRow: React.FC<LoyaltyCardActionRowProps> = ({
  onShare,
  onSaveToDevice,
  onOpenStaffStamp,
  onOpenNotificationBroadcaster,
  isExporting,
}) => {
  return (
    <>
      <div className="w-full mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onShare}
          disabled={isExporting}
          className="py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-600" />
          <span>مشاركة الكارت</span>
        </button>

        <button
          type="button"
          onClick={onSaveToDevice}
          disabled={isExporting}
          className="py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-stone-600" />
          <span>حفظ الكارت في ألبوم الصور</span>
        </button>
      </div>

      <div className="w-full mt-2.5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onOpenStaffStamp}
          className="text-xs text-amber-700 hover:text-amber-800 font-bold py-1 px-3 rounded-lg hover:bg-amber-50 transition cursor-pointer"
        >
          ⚡ ختم سريع بواسطة الموظف
        </button>

        {onOpenNotificationBroadcaster && (
          <button
            type="button"
            onClick={onOpenNotificationBroadcaster}
            className="text-xs text-stone-500 hover:text-stone-700 font-bold py-1 px-3 rounded-lg hover:bg-stone-100 transition cursor-pointer flex items-center gap-1"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>إشعار للمحفظة</span>
          </button>
        )}
      </div>
    </>
  );
};
