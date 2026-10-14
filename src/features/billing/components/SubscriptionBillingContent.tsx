'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';
import { BillingPlanStatusCard } from './BillingPlanStatusCard';
import { BillingQuotasGrid } from './BillingQuotasGrid';
import { BillingPlansUpgradeGrid } from './BillingPlansUpgradeGrid';
import { BillingInvoicesTable } from './BillingInvoicesTable';
import { BillingInvoiceModal } from './BillingInvoiceModal';
import { BillingCardUpdateModal } from './BillingCardUpdateModal';
import { BillingCancelModal } from './BillingCancelModal';

interface Props {
  vm: UseSubscriptionBillingReturn;
  cafeSlug: string;
}

export const SubscriptionBillingContent: React.FC<Props> = ({ vm, cafeSlug }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {vm.notification && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-[#141212] text-[#FBF9F5] rounded-xl shadow-2xl flex items-center gap-3 border border-[#d97706]/40 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold">{vm.notification}</p>
        </div>
      )}

      <BillingPlanStatusCard vm={vm} />
      <BillingQuotasGrid vm={vm} />
      <BillingPlansUpgradeGrid vm={vm} />
      <BillingInvoicesTable vm={vm} />

      {/* Modals */}
      <BillingInvoiceModal vm={vm} cafeSlug={cafeSlug} />
      <BillingCardUpdateModal vm={vm} />
      <BillingCancelModal vm={vm} />
    </div>
  );
};
