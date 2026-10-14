'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingCancelModal: React.FC<Props> = ({ vm }) => {
  const {
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    subscription,
    handleToggleCancel,
  } = vm;

  if (!isCancelConfirmOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5 text-[#e6e1e1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#b45309] text-[#d97706] border border-[#d97706]/40 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FBF9F5] font-serif">
              {subscription.cancelAtPeriodEnd ? 'التراجع عن إيقاف الاشتراك' : 'تأكيد إيقاف التجديد التلقائي'}
            </h3>
            <p className="text-xs text-[#A19E9B]">حماية كاملة لبيانات المقهى وأختام العملاء</p>
          </div>
        </div>

        <p className="text-xs text-[#A19E9B] leading-relaxed">
          {subscription.cancelAtPeriodEnd
            ? 'هل ترغب في الاستمرار في باقتك الحالية وتفعيل التجديد التلقائي لضمان عدم توقف الشاشات والطباعة؟'
            : 'عند إيقاف التجديد، ستستمر باقتك نشطة حتى نهاية الفترة المدفوعة. ونضمن لك الحفاظ على كافة كروت العملاء، الأختام، وقوالب الفريمات لمدة 30 يوماً إضافية.'}
        </p>

        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsCancelConfirmOpen(false)}
            className="px-4 py-2 rounded-lg text-[#A19E9B] hover:bg-[#1C1B1B] text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleToggleCancel}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subscription.cancelAtPeriodEnd
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#d97706] hover:bg-[#b45309] text-[#FBF9F5]'
            }`}
          >
            {subscription.cancelAtPeriodEnd ? 'تأكيد استمرار الاشتراك' : 'تأكيد جدولة الإيقاف'}
          </button>
        </div>
      </div>
    </div>
  );
};
