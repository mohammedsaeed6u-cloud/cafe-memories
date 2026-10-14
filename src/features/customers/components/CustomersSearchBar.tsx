'use client';

import React from 'react';
import { Search, Plus, Radio, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface CustomersSearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filter: 'all' | 'vip' | 'regular' | 'frequent';
  setFilter: (f: 'all' | 'vip' | 'regular' | 'frequent') => void;
  onOpenAddModal: () => void;
  onOpenBulkBroadcast: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function CustomersSearchBar({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  onOpenAddModal,
  onOpenBulkBroadcast,
  onExportCsv,
  onRefresh,
  isLoading,
}: CustomersSearchBarProps) {
  return (
    <div className="p-5 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم الجوال، أو تصنيف العميل..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-xs text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none transition shadow-2xs placeholder:text-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <button
            type="button"
            onClick={onOpenBulkBroadcast}
            className="px-3.5 py-2 rounded-2xl bg-[#c92a54] hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>بث إشعار جماعي</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>إضافة عميل</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            title="تصدير كملف Excel / CSV"
            className="p-2.5 rounded-2xl border border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A] text-stone-600 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="تحديث البيانات"
            className="p-2.5 rounded-2xl border border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A] text-stone-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'كافة العملاء' },
          { id: 'vip', label: 'عملاء VIP (+5 زيارات)' },
          { id: 'frequent', label: 'زوار متكررون (3-4 زيارات)' },
          { id: 'regular', label: 'زوار جدد (1-2 زيارة)' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              filter === item.id
                ? 'bg-[#FBF9F5] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
