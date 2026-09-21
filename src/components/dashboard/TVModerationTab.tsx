'use client';

import React, { useState, useEffect } from 'react';
import { CustomerVisitRecord } from './CustomerCRMTab';
import { Monitor, Check, EyeOff, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface TVModerationTabProps {
  memories: CustomerVisitRecord[];
  screenId?: string;
  brandName?: string;
}

interface MemoryItem {
  id: string;
  name: string;
  photoStripUrl: string;
  status: 'approved' | 'hidden' | 'pending';
  caption?: string;
  createdAt?: string;
}

export const TVModerationTab: React.FC<TVModerationTabProps> = ({
  memories: initialMemories,
  screenId = 'screen-1',
  brandName = 'Memories',
}) => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync initial memories or fetch live from API
  useEffect(() => {
    async function loadLiveMemories() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/memories?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (data.memories && data.memories.length > 0) {
            setItems(
              data.memories.map((m: any) => ({
                id: m.id,
                name: m.customers?.display_name || 'زائر كافيه',
                photoStripUrl: m.optimized_url || m.original_url,
                status: m.status === 'approved' ? 'approved' : 'hidden',
                caption: m.caption,
                createdAt: m.created_at,
              }))
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch memories from API, using props fallback', err);
      } finally {
        setIsLoading(false);
      }

      // Fallback from passed props
      setItems(
        initialMemories.map((m) => ({
          id: m.id,
          name: m.name,
          photoStripUrl: m.photoStripUrl || m.photos?.[0] || '',
          status: 'approved',
        }))
      );
    }

    loadLiveMemories();
  }, [initialMemories]);

  const toggleApproval = async (id: string, currentStatus: 'approved' | 'hidden' | 'pending') => {
    setActionError(null);
    const newStatus = currentStatus === 'approved' ? 'hidden' : 'approved';

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetch('/api/v1/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryId: id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('فشل تحديث حالة الصورة في قاعدة البيانات');
      }

      // Notify any local listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('memories-wall-updated'));
      }
    } catch (err: any) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: currentStatus } : item))
      );
      setActionError(err.message || 'حدث خطأ أثناء تعديل حالة العرض');
    }
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
            تحكم بالصور المسموح بعرضها في الوقت الفعلي على شاشة العرض الحية — متصل بالخادم وSupabase RLS
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

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            <p className="font-bold text-stone-500 text-sm">جاري تحميل الأشرطة من الخادم...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-stone-500">لا توجد أشرطة صور بانتظار الفرز حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((mem) => {
              const isApproved = mem.status === 'approved';
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
                      onClick={() => toggleApproval(mem.id, mem.status)}
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
