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
    setToast('تم تسجيل العميل بنجاح في قاعدة بيانات الكافيه!');
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>سجل ولاء العملاء (Customer Retention CRM)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
              {customers.length} عميل مسجل
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            متابعة تكرار الزيارات وأرصدة الهدايا ومنح أختام يدوية لعملائك الدائمين.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل عميل جديد</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={customers.length === 0}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير CSV للعملاء</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200/80 w-full sm:w-auto">
          {[
            { id: 'all', label: 'كافة العملاء' },
            { id: 'vip', label: 'عملاء VIP (مؤهلون للهدية)' },
            { id: 'regular', label: 'عملاء في مسار التجميع' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
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
            className="w-full px-3.5 py-2 pr-9 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 focus:outline-none focus:border-amber-500 transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Table or Empty State */}
      {isLoadingCustomers ? (
        <TableSkeleton rows={6} />
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-stone-200/90 text-center shadow-xs space-y-2">
          <Users className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-bold text-sm text-stone-700">لا يوجد عملاء مسجلون حالياً</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            عندما يقوم الضيوف بحفظ كارت الولاء في هواتفهم أو عندما تسجلهم يدويًا، ستظهر بياناتهم هنا تلقائياً.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200/80 font-bold">
                <tr>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">عدد الزيارات</th>
                  <th className="py-3 px-4">حالة الولاء</th>
                  <th className="py-3 px-4">آخر زيارة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredCustomers.map((c) => {
                  const isVip = c.totalVisits >= requiredVisits;
                  const rawPhone = c.id.replace('c_', '');
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-3.5 px-4 font-bold text-stone-950 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                          {c.displayName.charAt(0) || 'ض'}
                        </div>
                        <span>{c.displayName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600" dir="ltr">
                        {rawPhone}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {c.totalVisits} زيارة
                      </td>
                      <td className="py-3.5 px-4">
                        {isVip ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>مستحق للهدية ({Math.floor(c.totalVisits / requiredVisits)})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px]">
                            {c.totalVisits % requiredVisits} من {requiredVisits} أختام
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-500">
                        {new Date(c.lastSeenAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAddDirectStamp(c)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="ختم يدوي مباشر (+1)"
                          >
                            <Coffee className="w-3 h-3" />
                            <span>+1 ختم</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-stone-900">تسجيل عميل جديد يدوياً</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">اسم العميل:</label>
                <input
                  type="text"
                  required
                  placeholder="محمد السعيد"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">رقم الجوال:</label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  placeholder="05xxxxxxxx"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  حفظ وتسجيل العميل
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50"
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
