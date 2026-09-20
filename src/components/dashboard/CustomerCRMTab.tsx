'use client';

import React, { useState } from 'react';
import { CUSTOMER_PERSONAS } from '@/lib/constants/photobooth-presets';
import { CustomerPersonaKey } from '@/types/photobooth';
import {
  Users,
  Search,
  Download,
  Copy,
  MessageCircle,
  Phone,
  Image as ImageIcon,
  Check,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export interface CustomerVisitRecord {
  id: string;
  name: string;
  phone: string;
  role: CustomerPersonaKey;
  totalVisits: number;
  lastVisit: string;
  giftCode?: string;
  photoStripUrl?: string;
  photos?: string[];
}

interface CustomerCRMTabProps {
  customers: CustomerVisitRecord[];
  onExportCsv: () => void;
  brandName?: string;
}

export const CustomerCRMTab: React.FC<CustomerCRMTabProps> = ({
  customers,
  onExportCsv,
  brandName = 'Memories',
}) => {
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [selectedStripModal, setSelectedStripModal] = useState<CustomerVisitRecord | null>(null);

  // Filter customers by persona and search query
  const filteredCustomers = customers.filter((c) => {
    const matchesPersona =
      selectedPersona === 'all' || c.role === selectedPersona;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesPersona && matchesSearch;
  });

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const getPersonaBadge = (roleKey: CustomerPersonaKey) => {
    const persona = CUSTOMER_PERSONAS.find((p) => p.key === roleKey);
    if (!persona) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${persona.badgeColor}`}
      >
        <span>{persona.icon}</span>
        <span>{persona.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>سجل العملاء والـ CRM المربوط بالصور</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            إجمالي {customers.length} عميل تم بناء بروفايلهم وتوثيق زياراتهم بالصور
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel / CSV مع التصنيف</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Search + Persona Chips */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو برقم الموبايل..."
            className="w-full pr-11 pl-4 py-2.5 rounded-2xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Persona Chips */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-2">
            تصفية حسب تصنيف العميل (Persona):
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPersona('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                selectedPersona === 'all'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              الكل ({customers.length})
            </button>
            {CUSTOMER_PERSONAS.map((p) => {
              const count = customers.filter((c) => c.role === p.key).length;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPersona(p.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${
                    selectedPersona === p.key
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customers Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-black uppercase text-stone-500 tracking-wider">
                <th className="py-4 px-5">العميل</th>
                <th className="py-4 px-5">التصنيف / المجال</th>
                <th className="py-4 px-5">رقم الموبايل والتواصل</th>
                <th className="py-4 px-5">الزيارات والصورة</th>
                <th className="py-4 px-5">آخر زيارة</th>
                <th className="py-4 px-5">الإجراء السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    لا يوجد عملاء يطابقون هذا البحث والتصنيف
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/80 transition">
                    {/* Customer Name */}
                    <td className="py-4 px-5 font-bold text-stone-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                          {customer.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="leading-tight">{customer.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                            ID: {customer.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Persona Badge */}
                    <td className="py-4 px-5">{getPersonaBadge(customer.role)}</td>

                    {/* Phone & Direct Contact */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span>{customer.phone}</span>
                        <button
                          onClick={() => handleCopyPhone(customer.phone)}
                          className="text-stone-400 hover:text-stone-700 transition"
                          title="نسخ الرقم"
                        >
                          {copiedPhone === customer.phone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Visits & Linked Strip Preview */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-800">
                          {customer.totalVisits} زيارة
                        </span>

                        {customer.photoStripUrl ? (
                          <button
                            onClick={() => setSelectedStripModal(customer)}
                            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>عرض الشريط</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400">بدون شريط</span>
                        )}
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="py-4 px-5 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {new Date(customer.lastVisit).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Direct Marketing Action Buttons */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `أهلاً يا ${customer.name}! يسعدنا دائماً زيارتك في ${brandName}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition"
                          title="مراسلة عبر واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        {/* Call */}
                        <a
                          href={`tel:${customer.phone}`}
                          className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center transition"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strip Photo Preview Modal */}
      {selectedStripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full text-stone-900 text-center shadow-2xl">
            <h4 className="font-bold text-base mb-1">
              شريط ذكريات: {selectedStripModal.name}
            </h4>
            <p className="text-xs text-stone-500 mb-4">
              {getPersonaBadge(selectedStripModal.role)}
            </p>

            <div className="max-h-[70vh] overflow-y-auto flex justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedStripModal.photoStripUrl}
                alt="Customer Strip"
                className="max-h-[500px] object-contain rounded-xl shadow-lg border border-stone-200"
              />
            </div>

            <button
              onClick={() => setSelectedStripModal(null)}
              className="mt-5 w-full py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
