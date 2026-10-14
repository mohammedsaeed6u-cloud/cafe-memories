'use client';

import React from 'react';
import { FileText, Check, Download } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingInvoicesTable: React.FC<Props> = ({ vm }) => {
  const { invoices, formatDate, setSelectedInvoice } = vm;

  return (
    <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <FileText className="w-4 h-4 text-[#d97706]" />
            <span>الفواتير الضريبية وسجل السداد (ZATCA Tax Invoices)</span>
          </h3>
          <p className="text-xs text-[#A19E9B] mt-0.5">
            فواتير ضريبية إلكترونية نظامية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك
          </p>
        </div>

        <div className="text-xs text-[#A19E9B] bg-[#0B0A0A] px-3 py-1.5 rounded-lg border border-white/10 font-mono">
          الرقم الضريبي للمنصة: 310294850200003
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="p-12 text-center text-[#A19E9B]/50 text-sm">لا توجد فواتير سابقة حتى الآن.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#1C1B1B] text-[11px] font-bold uppercase text-[#A19E9B] tracking-wider font-mono">
                <th className="py-3.5 px-5">رقم الفاتورة</th>
                <th className="py-3.5 px-5">التاريخ</th>
                <th className="py-3.5 px-5">فترة الفوترة</th>
                <th className="py-3.5 px-5">المبلغ الأساسي</th>
                <th className="py-3.5 px-5">الضريبة (15%)</th>
                <th className="py-3.5 px-5">الإجمالي</th>
                <th className="py-3.5 px-5">الحالة</th>
                <th className="py-3.5 px-5 text-center">الفاتورة الضريبية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-[#e6e1e1]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#1C1B1B]/50 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-[#FBF9F5]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-5 text-[#A19E9B]">{formatDate(inv.date)}</td>
                  <td className="py-3.5 px-5 text-[#A19E9B] font-mono text-[11px]">
                    {new Date(inv.periodStart).toLocaleDateString('en-GB')} -{' '}
                    {new Date(inv.periodEnd).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3.5 px-5 text-[#FBF9F5] font-bold font-mono">{inv.amount} ر.س</td>
                  <td className="py-3.5 px-5 text-[#A19E9B] font-mono">{inv.taxAmount} ر.س</td>
                  <td className="py-3.5 px-5 font-bold font-mono text-[#FBF9F5]">{inv.totalAmount} ر.س</td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#b45309]/70 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>مدفوعة</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold transition shadow-sm text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>عرض الفاتورة</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
