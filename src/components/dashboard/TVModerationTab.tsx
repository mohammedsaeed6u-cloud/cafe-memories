'use client';

import React, { useState } from 'react';
import { CustomerVisitRecord } from './CustomerCRMTab';
import { Monitor, Check, EyeOff, Sparkles } from 'lucide-react';

interface TVModerationTabProps {
  memories: CustomerVisitRecord[];
  screenId?: string;
  brandName?: string;
}

export const TVModerationTab: React.FC<TVModerationTabProps> = ({
  memories,
  screenId = 'screen-1',
  brandName = 'Memories',
}) => {
  const [approvedStatus, setApprovedStatus] = useState<Record<string, boolean>>({});

  const toggleApproval = (id: string) => {
    setApprovedStatus((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-600" />
            <span>فرز واعتماد شرائط العرض على شاشة الكافيه (TV Wall)</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            تحكم بالصور المسموح بعرضها في الوقت الفعلي على شاشة العرض الحية
          </p>
        </div>

        <a
          href={`/wall/${screenId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>فتح شاشة العرض الحية (Wall)</span>
        </a>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        {memories.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-stone-500">لا توجد أشرطة صور بانتظار الفرز حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {memories.map((mem) => {
              const isApproved = approvedStatus[mem.id] ?? true;
              return (
                <div
                  key={mem.id}
                  className={`rounded-2xl border-2 overflow-hidden transition flex flex-col ${
                    isApproved
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-stone-200 bg-stone-50 opacity-60'
                  }`}
                >
                  <div className="aspect-[2/3] bg-stone-100 overflow-hidden relative">
                    {mem.photoStripUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mem.photoStripUrl}
                        alt="Memory"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                        شريط صور
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {mem.name}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-2 border-t border-stone-200 bg-white">
                    <span className="text-[11px] font-bold text-stone-700">
                      {isApproved ? 'معروض على الشاشة' : 'مخفي'}
                    </span>
                    <button
                      onClick={() => toggleApproval(mem.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        isApproved
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isApproved ? <EyeOff className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{isApproved ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
