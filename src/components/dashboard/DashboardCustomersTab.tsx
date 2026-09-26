'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Plus,
  Coffee,
  CheckCircle,
  FileSpreadsheet,
  Award,
  Phone,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';

export interface CustomerRecord {
  id: string;
  displayName: string;
  totalVisits: number;
  lastSeenAt: string;
  memoriesCount: number;
  rewardsCount: number;
}

interface DashboardCustomersTabProps {
  customers: CustomerRecord[];
  isLoadingCustomers: boolean;
  onAddDirectStamp: (c: CustomerRecord) => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  cafeSlug: string;
  requiredVisits: number;
}

export const DashboardCustomersTab: React.FC<DashboardCustomersTabProps> = ({
  customers,
  isLoadingCustomers,
  onAddDirectStamp,
  onExportCsv,
  onRefresh,
  cafeSlug,
  requiredVisits,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'regular'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const isVip = c.totalVisits >= requiredVisits;
    const matchesFilter =
      filter === 'all' || (filter === 'vip' ? isVip : !isVip);
    const matchesSearch =
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPhone.trim() || !newCustName.trim()) return;
    CustomerRegistryService.registerCustomer(
      newCustPhone.trim(),
      newCustName.trim(),
      'coffee_lover',
      cafeSlug
    );
    setNewCustPhone('');
    setNewCustName('');
    setIsAddModalOpen(false);
    onRefresh();
    setToast('تم تسجيل العميل بنجاح في قاعدة البيانات!');
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteCustomer = (c: CustomerRecord) => {
    const rawPhone = c.id.replace('c_', '');
    CustomerRegistryService.deleteCustomer(rawPhone, cafeSlug);
    onRefresh();
    setToast(`تم حذف سجل العميل (${c.displayName}) بنجاح.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl bg-[#1A0706] border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-[#DD0200] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Users className="w-5 h-5 text-[#DD0200]" />
              <span>سجل ولاء العملاء (Customer Retention CRM)</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-md bg-[#1C1B1B] border border-white/10 text-[#A19E9B] text-xs font-mono font-bold">
              {customers.length} عميل مسجل
            </span>
          </div>
          <p className="text-xs text-[#A19E9B] mt-1 font-sans">
            متابعة تكرار الزيارات وأرصدة الهدايا ومنح أختام يدوية لعملائك الدائمين.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل عميل جديد</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={customers.length === 0}
            className="px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير CSV للعملاء</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] transition cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#141212] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
          {[
            { id: 'all', label: 'كافة العملاء' },
            { id: 'vip', label: 'عملاء VIP (مؤهلون للهدية)' },
            { id: 'regular', label: 'عملاء في مسار التجميع' },
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
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pr-9 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/50 focus:outline-none focus:border-[#DD0200] transition"
          />
          <Search className="w-4 h-4 text-[#A19E9B]/60 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Table or Empty State */}
      {isLoadingCustomers ? (
        <TableSkeleton rows={6} />
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141212] border border-white/10 text-center shadow-xl space-y-2">
          <Users className="w-10 h-10 text-[#A19E9B]/30 mx-auto" />
          <h4 className="font-bold text-sm text-[#FBF9F5]">لا يوجد عملاء مسجلون حالياً</h4>
          <p className="text-xs text-[#A19E9B] max-w-md mx-auto leading-relaxed">
            عندما يقوم الضيوف بحفظ كارت الولاء في هواتفهم أو عندما تسجلهم يدويًا، ستظهر بياناتهم هنا تلقائياً.
          </p>
        </div>
      ) : (
        <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1C1B1B] text-[#A19E9B] border-b border-white/10 font-bold">
                <tr>
                  <th className="py-3.5 px-4 font-serif">العميل</th>
                  <th className="py-3.5 px-4 font-serif">رقم الجوال</th>
                  <th className="py-3.5 px-4 font-serif">عدد الزيارات</th>
                  <th className="py-3.5 px-4 font-serif">حالة الولاء</th>
                  <th className="py-3.5 px-4 font-serif">آخر زيارة</th>
                  <th className="py-3.5 px-4 text-center font-serif">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-[#e6e1e1]">
                {filteredCustomers.map((c) => {
                  const isVip = c.totalVisits >= requiredVisits;
                  const rawPhone = c.id.replace('c_', '');
                  return (
                    <tr key={c.id} className="hover:bg-[#1C1B1B]/50 transition">
                      <td className="py-3.5 px-4 font-bold text-[#FBF9F5] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold text-xs">
                          {c.displayName.charAt(0) || 'ض'}
                        </div>
                        <span>{c.displayName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A19E9B]" dir="ltr">
                        {rawPhone}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FBF9F5]">
                        {c.totalVisits} زيارة
                      </td>
                      <td className="py-3.5 px-4">
                        {isVip ? (
                          <span className="px-2.5 py-1 rounded-md bg-[#55100D]/70 border border-[#DD0200]/50 text-[#FBF9F5] font-bold text-[10px] inline-flex items-center gap-1 shadow-sm">
                            <Award className="w-3 h-3 text-[#DD0200]" />
                            <span>مستحق للهدية ({Math.floor(c.totalVisits / requiredVisits)})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#1C1B1B] border border-white/10 text-[#A19E9B] font-bold text-[10px]">
                            {c.totalVisits % requiredVisits} من {requiredVisits} أختام
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A19E9B]">
                        {new Date(c.lastSeenAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAddDirectStamp(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-[11px] transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center gap-1 cursor-pointer"
                            title="ختم يدوي مباشر (+1)"
                          >
                            <Coffee className="w-3 h-3" />
                            <span>+1 ختم</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c)}
                            className="p-1 rounded-lg hover:bg-rose-950/40 text-[#A19E9B]/60 hover:text-rose-400 transition cursor-pointer"
                            title="حذف العميل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141212] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#FBF9F5] font-serif">تسجيل عميل جديد يدوياً</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FBF9F5] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1">اسم العميل:</label>
                <input
                  type="text"
                  required
                  placeholder="محمد السعيد"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/50 focus:outline-none focus:border-[#DD0200] font-bold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A19E9B] mb-1">رقم الجوال:</label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  placeholder="05xxxxxxxx"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/50 focus:outline-none focus:border-[#DD0200] font-mono font-bold transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
                >
                  حفظ وتسجيل العميل
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
