'use client';

import React from 'react';
import { X, QrCode, Download } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
  cafeSlug: string;
}

export const BillingInvoiceModal: React.FC<Props> = ({ vm, cafeSlug }) => {
  const { selectedInvoice, setSelectedInvoice, formatDate } = vm;
  if (!selectedInvoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 relative max-h-[90vh] overflow-y-auto text-[#e6e1e1]">
        <button
          onClick={() => setSelectedInvoice(null)}
          className="absolute top-6 left-6 p-2 rounded-lg text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#1C1B1B] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Invoice Top */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1C1B1B] text-[#A19E9B] border border-white/10">
              فاتورة ضريبية مبسطة • Simplified Tax Invoice
            </span>
            <h3 className="text-xl font-bold text-[#FBF9F5] mt-1 font-mono">
              {selectedInvoice.invoiceNumber}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-sans font-bold text-xl shadow-md">
            S
          </div>
        </div>

        {/* Vendor & Buyer Info */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-[#1C1B1B] p-4 rounded-xl border border-white/10">
          <div>
            <p className="font-bold text-[#A19E9B]">المورد (Seller):</p>
            <p className="font-bold text-[#FBF9F5] mt-0.5">منصة ستامبي السحابية (Stampy SaaS)</p>
            <p className="text-[11px] text-[#A19E9B] font-mono">الرقم الضريبي: 310294850200003</p>
            <p className="text-[11px] text-[#A19E9B]">الرياض، المملكة العربية السعودية</p>
          </div>
          <div>
            <p className="font-bold text-[#A19E9B]">العميل (Buyer):</p>
            <p className="font-bold text-[#FBF9F5] mt-0.5 font-mono">{cafeSlug}</p>
            <p className="text-[11px] text-[#A19E9B]">
              التاريخ: {formatDate(selectedInvoice.date)}
            </p>
            <p className="text-[11px] text-[#A19E9B]">طريقة الدفع: بطاقة مدى / ائتمانية</p>
          </div>
        </div>

        {/* Items */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1C1B1B] border-b border-white/10 font-bold text-[#A19E9B]">
              <tr>
                <th className="p-3">الوصف</th>
                <th className="p-3">المبلغ الخاضع للضريبة</th>
                <th className="p-3">نسبة الضريبة</th>
                <th className="p-3">قيمة الضريبة</th>
                <th className="p-3">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#e6e1e1]">
              <tr>
                <td className="p-3 font-bold text-[#FBF9F5]">
                  اشتراك منصة ذكريات - باقة {selectedInvoice.planId} (
                  {selectedInvoice.billingInterval === 'annually' ? 'سنوي' : 'شهري'})
                </td>
                <td className="p-3 text-[#FBF9F5] font-mono">{selectedInvoice.amount} ر.س</td>
                <td className="p-3 text-[#A19E9B] font-mono">15%</td>
                <td className="p-3 text-[#A19E9B] font-mono">{selectedInvoice.taxAmount} ر.س</td>
                <td className="p-3 font-bold text-[#FBF9F5] font-mono">{selectedInvoice.totalAmount} ر.س</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total & QR */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white border border-white/20 rounded-xl flex items-center justify-center p-1 shadow-md">
              <QrCode className="w-12 h-12 text-[#141212]" />
            </div>
            <div className="text-[10px] text-[#A19E9B] max-w-[180px] leading-tight">
              رمز الاستجابة السريع المشفر وفق لوائح هيئة الزكاة والضريبة والجمارك (ZATCA E-Invoicing)
            </div>
          </div>

          <div className="text-left space-y-1">
            <p className="text-xs text-[#A19E9B]">المبلغ الإجمالي المستحق:</p>
            <p className="text-2xl font-bold font-mono text-[#d97706]">
              {selectedInvoice.totalAmount} ر.س
            </p>
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#b45309]/70 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
              مدفوعة بالكامل
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-[#FBF9F5] font-bold text-xs flex items-center gap-1.5 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>طباعة / تحميل الفاتورة PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
