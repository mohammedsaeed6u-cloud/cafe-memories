'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Check,
  EyeOff,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';

export interface MemoryItem {
  id: string;
  customerName: string;
  originalUrl: string;
  status: 'pending' | 'approved' | 'hidden' | 'rejected';
  visibility: string;
  caption?: string;
  createdAt: string;
}

interface DashboardMemoriesTabProps {
  memories: MemoryItem[];
  isLoadingMemories: boolean;
  autoApproveWall: boolean;
  onToggleAutoApprove: (val: boolean) => void;
  onModerateMemory: (id: string, status: 'approved' | 'rejected' | 'hidden') => void;
  onDeleteMemory: (id: string) => void;
  onBatchApprove: () => void;
  onBatchHideAll: () => void;
  onRefresh: () => void;
  batchActionMsg: string | null;
}

export const DashboardMemoriesTab: React.FC<DashboardMemoriesTabProps> = ({
  memories,
  isLoadingMemories,
  autoApproveWall,
  onToggleAutoApprove,
  onModerateMemory,
  onDeleteMemory,
  onBatchApprove,
  onBatchHideAll,
  onRefresh,
  batchActionMsg,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);

  const filteredMemories = memories.filter((m) => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch =
      m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.caption && m.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Moderation Controls Header */}
      <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#DD0200]" />
              <span>إدارة واعتماد صور الصالة (Live Wall Moderation)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-[#1C1B1B] text-[#A19E9B] border border-white/10 text-xs font-mono font-bold">
              {memories.length} صورة مسجلة
            </span>
          </div>
          <p className="text-xs text-[#A19E9B] mt-1">
            تحكم كامل في الصور المعروضة على شاشات تلفزيون الصالة لحماية الخصوصية وملاءمة المحتوى.
          </p>
        </div>

        {/* Auto-Approve Toggle & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1C1B1B] border border-white/10 text-xs font-bold text-[#FBF9F5] cursor-pointer hover:bg-[#211F1F] transition">
            <input
              type="checkbox"
              checked={autoApproveWall}
              onChange={(e) => onToggleAutoApprove(e.target.checked)}
              className="rounded accent-[#DD0200] w-4 h-4 cursor-pointer"
            />
            <span>بث تلقائي فوري للشاشات</span>
          </label>

          <button
            type="button"
            onClick={onBatchApprove}
            className="px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>اعتماد الكل</span>
          </button>

          <button
            type="button"
            onClick={onBatchHideAll}
            className="px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>إخفاء الكل</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] transition cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMemories ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {batchActionMsg && (
        <div className="p-4 rounded-xl bg-[#55100D]/40 border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold animate-in fade-in shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#DD0200] shrink-0" />
          <span>{batchActionMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#1C1B1B] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'approved', label: 'معتمدة على الشاشة' },
            { id: 'hidden', label: 'مخفية' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'pending' && memories.filter((m) => m.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث باسم العميل أو التعليق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pr-9 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/50 focus:outline-none focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 transition shadow-inner"
          />
          <Search className="w-4 h-4 text-[#A19E9B] absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Moderation Grid */}
      {isLoadingMemories ? (
        <TableSkeleton rows={5} />
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141212] border border-white/10 text-center shadow-xl space-y-2">
          <ImageIcon className="w-10 h-10 text-[#A19E9B]/40 mx-auto" />
          <h4 className="font-bold text-sm text-[#FBF9F5]">لا توجد صور في هذا التصنيف</h4>
          <p className="text-xs text-[#A19E9B] max-w-md mx-auto leading-relaxed">
            عندما يلتقط الضيوف صورهم ويوافقون على المشاركة في الصالة، ستظهر الصور هنا لاعتمادها أو إخفائها فوراً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMemories.map((m) => {
            const isApproved = m.status === 'approved';
            const isPending = m.status === 'pending';
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl bg-[#141212] border transition flex flex-col justify-between gap-3 shadow-xl hover:border-white/20 ${
                  isApproved
                    ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isPending
                    ? 'border-[#DD0200]/40 ring-1 ring-[#DD0200]/20'
                    : 'border-white/10 opacity-60'
                }`}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0B0A0A] border border-white/10 group">
                  {m.originalUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.originalUrl}
                      alt={m.customerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A19E9B] text-xs">
                      لا تتوفر صورة
                    </div>
                  )}

                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : isPending
                        ? 'bg-[#55100D]/80 text-[#FBF9F5] border border-[#DD0200]/40'
                        : 'bg-[#1C1B1B] text-[#A19E9B] border border-white/10'
                    }`}
                  >
                    {isApproved ? 'معروضة على الشاشة' : isPending ? 'قيد المراجعة' : 'مخفية'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPreviewMemory(m)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer backdrop-blur-2xs"
                  >
                    <Eye className="w-4 h-4 text-[#DD0200]" />
                    <span>تكبير ومعاينة</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-[#FBF9F5] truncate">{m.customerName}</h4>
                  {m.caption && (
                    <p className="text-[11px] text-[#D9D9D9] line-clamp-1 italic">
                      "{m.caption}"
                    </p>
                  )}
                  <span className="text-[10px] text-[#A19E9B] font-mono block">
                    {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onModerateMemory(m.id, isApproved ? 'hidden' : 'approved')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      isApproved
                        ? 'bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10'
                        : 'bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-[#A19E9B]" />
                        <span>إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد للبث</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteMemory(m.id)}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 text-[#A19E9B] transition cursor-pointer"
                    title="حذف الصورة نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview */}
      {previewMemory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141212] border border-white/15 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#FBF9F5]">{previewMemory.customerName}</h3>
              <button
                type="button"
                onClick={() => setPreviewMemory(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#A19E9B] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#0B0A0A] border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewMemory.originalUrl}
                alt={previewMemory.customerName}
                className="w-full h-full object-cover"
              />
            </div>

            {previewMemory.caption && (
              <p className="text-xs text-[#D9D9D9] text-center italic">
                "{previewMemory.caption}"
              </p>
            )}

            <button
              type="button"
              onClick={() => setPreviewMemory(null)}
              className="w-full py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs cursor-pointer transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
