'use client';

import React, { useState } from 'react';
import { CustomerVisitRecord } from './CustomerCRMTab';
import { Printer, Gift, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface PrintStationTabProps {
  queue: CustomerVisitRecord[];
  onPrintItem?: (item: CustomerVisitRecord) => void;
  brandName?: string;
}

export const PrintStationTab: React.FC<PrintStationTabProps> = ({
  queue,
  onPrintItem,
  brandName = 'Memories',
}) => {
  const [handedOverGifts, setHandedOverGifts] = useState<Record<string, boolean>>({});

  const toggleGiftHandover = (id: string) => {
    setHandedOverGifts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = (item: CustomerVisitRecord) => {
    if (onPrintItem) {
      onPrintItem(item);
    } else {
      window.print();
    }
  };

  const completedPrintsCount = Object.values(handedOverGifts).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold">أشرطة بانتظار الطباعة</p>
            <p className="text-2xl font-black text-stone-900">{queue.length}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold">هدايا تم تسليمها اليوم</p>
            <p className="text-2xl font-black text-emerald-600">{completedPrintsCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold">نوع ورق الطباعة الموصى به</p>
            <p className="text-sm font-black text-stone-800">شريط كلاسيك 2x6 لامع</p>
          </div>
        </div>
      </div>

      {/* Print Queue List */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <h3 className="text-base font-black text-stone-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>طابور الأشرطة الجاهزة للطباعة والتسليم للباريستا</span>
        </h3>

        {queue.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Printer className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-stone-500">لا توجد طلبات طباعة جديدة في الطابور حالياً</p>
            <p className="text-xs text-stone-400 mt-1">
              ستظهر هنا أشرطة الصور فور اكتمال تصويرها من قبل العملاء
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item) => {
              const isHandedOver = !!handedOverGifts[item.id];
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border-2 transition flex items-center justify-between gap-4 ${
                    isHandedOver
                      ? 'bg-stone-50 border-stone-200 opacity-70'
                      : 'bg-white border-amber-200 shadow-sm hover:border-amber-400'
                  }`}
                >
                  {/* Strip Thumbnail */}
                  <div className="w-16 h-24 rounded-xl overflow-hidden border border-stone-300 bg-stone-100 flex-shrink-0 shadow-inner">
                    {item.photoStripUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

                  {/* Customer & Gift Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-sm truncate">
                        {item.name}
                      </h4>
                    </div>

                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                      {item.phone}
                    </p>

                    {/* Gift Code */}
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
                      <Gift className="w-3.5 h-3.5 text-amber-600" />
                      <span>{item.giftCode || '#GIFT-FREE'}</span>
                    </div>
                  </div>

                  {/* Actions: Print & Handover */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePrint(item)}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>طباعة 2x6</span>
                    </button>

                    <button
                      onClick={() => toggleGiftHandover(item.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isHandedOver
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHandedOver ? 'تم التسليم' : 'تسليم الهدية'}</span>
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
