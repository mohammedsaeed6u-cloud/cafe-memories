'use client';

import React from 'react';
import { CreditCard, Search, ExternalLink, Eye, Trash2, X } from 'lucide-react';

interface WalletIssuedPassesTableProps {
  passesList: any[];
  filteredPasses: any[];
  isLoadingPasses: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inspectingPassBody: any | null;
  setInspectingPassBody: (b: any | null) => void;
  inspectPassLoading: boolean;
  revokingSerial: string | null;
  onInspectPass: (serial: string) => void;
  onRevokePass: (serial: string) => void;
}

export function WalletIssuedPassesTable({
  passesList,
  filteredPasses,
  isLoadingPasses,
  searchQuery,
  setSearchQuery,
  inspectingPassBody,
  setInspectingPassBody,
  inspectPassLoading,
  revokingSerial,
  onInspectPass,
  onRevokePass,
}: WalletIssuedPassesTableProps) {
  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.1)]/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#c92a54]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#FBF9F5] flex items-center gap-2">
              <span>سجل الكروت المُصدرة حياً (Active Passes Registry)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 font-mono text-stone-700">
                {passesList.length} كارت
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              مراقبة الكروت المضافة في Apple Wallet، رابط التنزيل، وميزة إلغاء الصلاحية الفورية
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="بحث بالرقم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
          />
        </div>
      </div>

      {isLoadingPasses ? (
        <div className="p-12 text-center text-xs text-stone-400">جاري تحميل سجل الكروت...</div>
      ) : filteredPasses.length === 0 ? (
        <div className="p-12 text-center text-xs text-stone-400">لا توجد كروت تطابق البحث.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)] text-stone-500 font-bold">
                <th className="pb-3 px-2">الرقم التسلسلي (Serial)</th>
                <th className="pb-3 px-2">العميل / العنوان</th>
                <th className="pb-3 px-2">تاريخ الإصدار</th>
                <th className="pb-3 px-2">نوع الباركود</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 px-2 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.1)]/60">
              {filteredPasses.map((pass) => (
                <tr key={pass.serialNumber || pass.id} className="hover:bg-[#0B0A0A]/60 transition">
                  <td className="py-3 px-2 font-mono text-stone-800 font-bold text-[11px]">
                    {pass.serialNumber || 'N/A'}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-bold text-[#FBF9F5] block">{pass.title || 'كارت ولاء'}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{pass.detail || ''}</span>
                  </td>
                  <td className="py-3 px-2 text-stone-600 font-mono text-[11px]">
                    {pass.createdAt ? new Date(pass.createdAt).toLocaleDateString('ar-EG') : 'حديثاً'}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 font-mono text-[10px] text-stone-700">
                      {pass.barcodeFormat || 'QR'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {pass.revoked ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        ملغي
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        نشط ومفعل
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {pass.url && (
                        <a
                          href={pass.url}
                          target="_blank"
                          rel="noreferrer"
                          title="فتح ملف الكارت .pkpass"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onInspectPass(pass.serialNumber)}
                        title="فحص حقول JSON للكارت"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!pass.revoked && (
                        <button
                          type="button"
                          disabled={revokingSerial === pass.serialNumber}
                          onClick={() => onRevokePass(pass.serialNumber)}
                          title="إلغاء الكارت نهائياً"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Pass Body Modal */}
      {inspectingPassBody && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141212] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-[rgba(255,255,255,0.1)] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <h4 className="text-sm font-black text-[#FBF9F5]">
                تفاصيل حقول الكارت (Pass JSON Body) - {inspectingPassBody.serial}
              </h4>
              <button
                type="button"
                onClick={() => setInspectingPassBody(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="flex-1 overflow-auto bg-stone-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono leading-relaxed text-left" dir="ltr">
              {JSON.stringify(inspectingPassBody, null, 2)}
            </pre>

            <div className="text-left pt-1">
              <button
                type="button"
                onClick={() => setInspectingPassBody(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
