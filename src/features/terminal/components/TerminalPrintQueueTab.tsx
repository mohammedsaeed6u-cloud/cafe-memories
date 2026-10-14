'use client';

import React from 'react';
import { Clock, Bell, BellOff, Printer, Check } from 'lucide-react';

interface TerminalPrintQueueTabProps {
  printQueue: any[];
  soundAlertEnabled: boolean;
  onToggleSoundAlert: () => void;
  onPrintItem: (item: any, format: 'standard-2x6' | 'postcard-4x6' | 'square-4x4') => void;
  onDismissPrint: (id: string) => void;
}

export function TerminalPrintQueueTab({
  printQueue,
  soundAlertEnabled,
  onToggleSoundAlert,
  onPrintItem,
  onDismissPrint,
}: TerminalPrintQueueTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c92a54]" />
          <span>طابور الأشرطة الجاهزة للطباعة من الزوار</span>
        </h3>

        <button
          type="button"
          onClick={onToggleSoundAlert}
          className="px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white hover:bg-[#0B0A0A] text-xs font-bold text-stone-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          {soundAlertEnabled ? <Bell className="w-3.5 h-3.5 text-[#c92a54]" /> : <BellOff className="w-3.5 h-3.5 text-stone-400" />}
          <span>{soundAlertEnabled ? 'جرس التنبيه مفعل' : 'جرس التنبيه مكتوم'}</span>
        </button>
      </div>

      {printQueue.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] text-center shadow-xs space-y-2">
          <Printer className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-bold text-sm text-[#FBF9F5]">لا توجد طلبات طباعة معلقة حالياً</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            عندما يكمل الزوار التقاط شريط الصور ويطلبون طباعته من هواتفهم، سيظهر هنا فوراً مع صوت تنبيه لطاقم العمل.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {printQueue.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] hover:border-[#c92a54] shadow-xs flex items-center justify-between gap-4 transition"
            >
              <div className="w-16 h-24 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)] bg-stone-100 shrink-0 shadow-inner">
                {item.photoStripUrl ? (
                  <img
                    src={item.photoStripUrl}
                    alt="Strip"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]">
                    2x6
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#FBF9F5] text-sm truncate">
                  {item.name || 'عميل مميز'}
                </h4>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  {item.phone || 'طلب فوري'}
                </p>
                <span className="text-[10px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-2 font-mono uppercase tracking-wider">
                  {item.format || 'standard-2x6'}
                </span>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onPrintItem(item, 'standard-2x6')}
                  className="px-3.5 py-2 rounded-xl bg-[#c92a54] hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة 2×6</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDismissPrint(item.id)}
                  className="px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A] text-stone-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم التسليم</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
