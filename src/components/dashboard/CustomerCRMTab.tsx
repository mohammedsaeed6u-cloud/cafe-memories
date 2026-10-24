'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  Phone,
  Calendar,
  Gift,
  CheckCircle2,
  Award,
  Filter,
} from 'lucide-react';
import { TicketButton } from '@/components/ui/TicketButton';

export interface CustomerVisitRecord {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  photoStripUrl?: string;
  status?: string;
  giftCode?: string;
  photos?: string[];
  [key: string]: any;
}

export interface CustomerCRMRecord {
  id: string;
  name: string;
  phone: string;
  stamps: number;
  totalGoal: number;
  redeemedCount: number;
  firstVisit: string;
  lastVisit: string;
  notes?: string;
}

const INITIAL_CUSTOMERS: CustomerCRMRecord[] = [
  {
    id: 'cust-1',
    name: 'عبدالله السعد',
    phone: '0551234567',
    stamps: 4,
    totalGoal: 5,
    redeemedCount: 1,
    firstVisit: '2026-09-15',
    lastVisit: 'اليوم، 18:30',
  },
  {
    id: 'cust-2',
    name: 'نورة المنصور',
    phone: '0509876543',
    stamps: 5,
    totalGoal: 5,
    redeemedCount: 2,
    firstVisit: '2026-08-20',
    lastVisit: 'أمس، 20:15',
  },
  {
    id: 'cust-3',
    name: 'فيصل الحربي',
    phone: '0543322110',
    stamps: 2,
    totalGoal: 5,
    redeemedCount: 0,
    firstVisit: '2026-10-10',
    lastVisit: 'منذ 3 أيام',
  },
  {
    id: 'cust-4',
    name: 'ريم العتيبي',
    phone: '0567788990',
    stamps: 3,
    totalGoal: 5,
    redeemedCount: 1,
    firstVisit: '2026-07-04',
    lastVisit: 'منذ أسبوع',
  },
];

export function CustomerCRMTab() {
  const [customers, setCustomers] = useState<CustomerCRMRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stampy_crm_customers');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_CUSTOMERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);

  const saveCustomers = (updated: CustomerCRMRecord[]) => {
    setCustomers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stampy_crm_customers', JSON.stringify(updated));
    }
  };

  // Direct Instant Stamping from CRM ("الختم بيمتع دايركت")
  const handleInstantStamp = (customerId: string, customerName: string) => {
    // Play tactile audio click
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}

    const updated = customers.map((c) => {
      if (c.id === customerId) {
        const nextStamps = c.stamps + 1;
        return {
          ...c,
          stamps: nextStamps > c.totalGoal ? 1 : nextStamps,
          redeemedCount: nextStamps >= c.totalGoal ? c.redeemedCount + 1 : c.redeemedCount,
          lastVisit: 'الآن',
        };
      }
      return c;
    });

    saveCustomers(updated);
    setStampFeedback(`✨ تم إضافة ختم فوري بنجاح للعميل "${customerName}"!`);
    setTimeout(() => setStampFeedback(null), 3500);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#3D2314] rounded-2xl p-5 sm:p-6 shadow-stamp-resting">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B83A26] uppercase">
            <Users className="w-4 h-4" />
            <span>CUSTOMER RETENTION & LOYALTY CRM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3D2314] mt-1">
            سجل العملاء وإدارة بطاقات الولاء
          </h2>
          <p className="text-xs text-[#3D2314]/70 mt-1">
            قاعدة بيانات حية بجميع العملاء وأختامهم، مع إمكانية الختم الفوري والمباشر بنقرة زر واحدة.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB] text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#3D2314]/40 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Instant Action Feedback */}
      {stampFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{stampFeedback}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting">
          <span className="text-[11px] font-bold text-[#3D2314]/60 block">إجمالي العملاء</span>
          <span className="text-2xl font-black text-[#3D2314]">{customers.length}</span>
        </div>
        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting">
          <span className="text-[11px] font-bold text-[#3D2314]/60 block">الأختام الممنوحة</span>
          <span className="text-2xl font-black text-[#B83A26]">
            {customers.reduce((acc, c) => acc + c.stamps, 0)}
          </span>
        </div>
        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting">
          <span className="text-[11px] font-bold text-[#3D2314]/60 block">المكافآت المصروفة</span>
          <span className="text-2xl font-black text-[#E5A836]">
            {customers.reduce((acc, c) => acc + c.redeemedCount, 0)}
          </span>
        </div>
        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting">
          <span className="text-[11px] font-bold text-[#3D2314]/60 block">نسبة الولاء والتكرار</span>
          <span className="text-2xl font-black text-[#527E78]">85%</span>
        </div>
      </div>

      {/* Customer CRM Table */}
      <div className="bg-white border-2 border-[#3D2314] rounded-2xl shadow-stamp-resting overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-[#3D2314] flex items-center justify-between bg-[#FAF5EB]">
          <h3 className="font-bold text-sm text-[#3D2314] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B83A26]" />
            <span>سجل العملاء النشطين ({filtered.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-[#3D2314]/60">
            تحديث فوري • Live CRM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF5EB]/60 border-b border-[#EADDC4] text-[#3D2314]/80 font-bold">
              <tr>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">رقم الجوال</th>
                <th className="p-3.5">رصيد الأختام</th>
                <th className="p-3.5">الجوائز المصروفة</th>
                <th className="p-3.5">آخر زيارة</th>
                <th className="p-3.5 text-center">الإجراء المباشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADDC4]">
              {filtered.map((customer) => {
                const isReadyForReward = customer.stamps >= customer.totalGoal;
                return (
                  <tr key={customer.id} className="hover:bg-[#FAF5EB]/40 transition">
                    <td className="p-3.5 font-bold text-[#3D2314]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#E5A836] border border-[#3D2314] flex items-center justify-center font-black text-xs text-[#3D2314]">
                          {customer.name.charAt(0)}
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[#3D2314]" dir="ltr">
                      {customer.phone}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: customer.totalGoal }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-4 h-4 rounded-full border border-[#3D2314] flex items-center justify-center text-[9px] font-bold ${
                                idx < customer.stamps
                                  ? 'bg-[#B83A26] text-white'
                                  : 'bg-white text-transparent'
                              }`}
                            >
                              ✦
                            </span>
                          ))}
                        </div>
                        <span className="font-mono font-bold text-[#3D2314]">
                          {customer.stamps}/{customer.totalGoal}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-[#E5A836]">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#E5A836]" />
                        {customer.redeemedCount} مكافآت
                      </span>
                    </td>
                    <td className="p-3.5 text-[#3D2314]/70">{customer.lastVisit}</td>
                    <td className="p-3.5 text-center">
                      <TicketButton
                        type="button"
                        variant={isReadyForReward ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleInstantStamp(customer.id, customer.name)}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isReadyForReward ? 'صرف الجائزة 🎁' : '+1 ختم فوري'}</span>
                      </TicketButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
