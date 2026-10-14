'use client';

import React from 'react';
import { Phone, Copy, Check, MessageCircle, Award, Sliders, Unlock, CreditCard } from 'lucide-react';
import { CustomerRecord, PERSONA_LABELS } from '../types';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';

interface CustomersTableProps {
  customers: CustomerRecord[];
  isLoading: boolean;
  requiredVisits: number;
  copiedPhone: string | null;
  onCopyPhone: (phone?: string) => void;
  onAddDirectStamp: (c: CustomerRecord) => void;
  onOpenCardUpdate: (c: CustomerRecord) => void;
  onUnlockCooldown: (phone?: string, name?: string) => void;
  cafeSlug: string;
}

export function CustomersTable({
  customers,
  isLoading,
  requiredVisits,
  copiedPhone,
  onCopyPhone,
  onAddDirectStamp,
  onOpenCardUpdate,
  onUnlockCooldown,
  cafeSlug,
}: CustomersTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-stone-500 font-bold bg-[#141212] rounded-3xl border border-dashed border-[rgba(255,255,255,0.1)]">
        لا يوجد عملاء يطابقون معايير البحث حالياً.
      </div>
    );
  }

  return (
    <div className="bg-[#141212] rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-[#141313] border-b border-[rgba(255,255,255,0.1)] text-stone-500 font-bold">
              <th className="py-3.5 px-4">العميل</th>
              <th className="py-3.5 px-4">رقم الهاتف</th>
              <th className="py-3.5 px-4">الفئة / الاهتمام</th>
              <th className="py-3.5 px-4">الزيارات والأختام</th>
              <th className="py-3.5 px-4">آخر زيارة</th>
              <th className="py-3.5 px-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.1)]/60">
            {customers.map((customer) => {
              const persona = PERSONA_LABELS[customer.role || 'coffee_lover'] || PERSONA_LABELS.coffee_lover;
              const stampedCount = customer.totalVisits % (requiredVisits || 5);
              const progressPct = Math.min(100, Math.round((stampedCount / (requiredVisits || 5)) * 100));

              return (
                <tr key={customer.id} className="hover:bg-[#0B0A0A]/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FBF9F5] text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-stone-800">
                        {customer.displayName.charAt(0) || 'ع'}
                      </div>
                      <div>
                        <span className="font-bold text-[#FBF9F5] block text-xs">{customer.displayName}</span>
                        {customer.rewardsCount > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            🎁 استلم {customer.rewardsCount} مكافأة
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700">
                    {customer.phone ? (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span>{customer.phone}</span>
                        <button
                          type="button"
                          onClick={() => onCopyPhone(customer.phone)}
                          title="نسخ الرقم"
                          className="p-1 rounded hover:bg-stone-200 text-stone-500 transition cursor-pointer"
                        >
                          {copiedPhone === customer.phone ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-stone-400">غير مسجل</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${persona.badgeClass}`}>
                      {persona.label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#FBF9F5]">{stampedCount}/{requiredVisits} أختام</span>
                        <span className="text-stone-400">{customer.totalVisits} زيارة</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                        <div
                          className="h-full bg-[#c92a54] rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-stone-500 text-[11px] font-mono">
                    {customer.lastSeenAt ? new Date(customer.lastSeenAt).toLocaleDateString('ar-EG') : 'اليوم'}
                  </td>

                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAddDirectStamp(customer)}
                        title="ختم زيارة مباشرة"
                        className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-[#c92a54]" />
                        <span className="hidden sm:inline">ختم +1</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCardUpdate(customer)}
                        title="تخصيص كارت المحفظة وبث إشعار"
                        className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onUnlockCooldown(customer.phone, customer.displayName)}
                        title="فك قفل الـ 24 ساعة (Anti-Fraud Unlock)"
                        className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5 text-[#c92a54]" />
                      </button>

                      {customer.phone && (
                        <a
                          href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`أهلاً بك في متجرنا!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="مراسلة عبر واتساب"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
