'use client';

import React from 'react';
import { CustomerRecord } from '@/features/customers/types';
export type { CustomerRecord };
import { useCustomersManagement } from '@/features/customers/hooks/useCustomersManagement';
import { CustomerMetricsRibbon } from '@/features/customers/components/CustomerMetricsRibbon';
import { CustomersSearchBar } from '@/features/customers/components/CustomersSearchBar';
import { CustomersTable } from '@/features/customers/components/CustomersTable';
import {
  AddCustomerModal,
  CustomerCardCustomizerModal,
  BulkBroadcastModal,
} from '@/features/customers/components/CustomerModals';

interface DashboardCustomersTabProps {
  customers: CustomerRecord[];
  isLoadingCustomers: boolean;
  onAddDirectStamp: (c: CustomerRecord) => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  cafeSlug: string;
  requiredVisits: number;
  brandName?: string;
  cafeLogoUrl?: string;
}

export const DashboardCustomersTab: React.FC<DashboardCustomersTabProps> = ({
  customers,
  isLoadingCustomers,
  onAddDirectStamp,
  onExportCsv,
  onRefresh,
  cafeSlug,
  requiredVisits = 5,
  brandName = 'متجر الولاء',
  cafeLogoUrl,
}) => {
  const crm = useCustomersManagement(
    customers,
    cafeSlug,
    requiredVisits,
    brandName,
    cafeLogoUrl,
    onRefresh
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Metrics Ribbon */}
      <CustomerMetricsRibbon customers={customers} />

      {/* Toast Feedback */}
      {crm.toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs shadow-xs animate-in fade-in">
          {crm.toast.message}
        </div>
      )}

      {/* Search & Action Bar */}
      <CustomersSearchBar
        searchQuery={crm.searchQuery}
        setSearchQuery={crm.setSearchQuery}
        filter={crm.filter}
        setFilter={crm.setFilter}
        onOpenAddModal={() => crm.setIsAddModalOpen(true)}
        onOpenBulkBroadcast={() => crm.setIsBulkBroadcastOpen(true)}
        onExportCsv={onExportCsv}
        onRefresh={onRefresh}
        isLoading={isLoadingCustomers}
      />

      {/* Customers Table */}
      <CustomersTable
        customers={crm.filteredCustomers}
        isLoading={isLoadingCustomers}
        requiredVisits={requiredVisits}
        copiedPhone={crm.copiedPhone}
        onCopyPhone={crm.handleCopyPhone}
        onAddDirectStamp={onAddDirectStamp}
        onOpenCardUpdate={crm.openCardUpdateModal}
        onUnlockCooldown={crm.handleUnlockCooldown}
        cafeSlug={cafeSlug}
      />

      {/* Modals */}
      <AddCustomerModal
        isOpen={crm.isAddModalOpen}
        onClose={() => crm.setIsAddModalOpen(false)}
        phone={crm.newCustPhone}
        setPhone={crm.setNewCustPhone}
        name={crm.newCustName}
        setName={crm.setNewCustName}
        role={crm.newCustRole}
        setRole={crm.setNewCustRole}
        onSubmit={crm.handleAddCustomerSubmit}
      />

      <CustomerCardCustomizerModal
        customer={crm.cardUpdateCustomer}
        onClose={() => crm.setCardUpdateCustomer(null)}
        editStampsCount={crm.editStampsCount}
        setEditStampsCount={crm.setEditStampsCount}
        editGiftTitle={crm.editGiftTitle}
        setEditGiftTitle={crm.setEditGiftTitle}
        editColorHex={crm.editColorHex}
        setEditColorHex={crm.setEditColorHex}
        editStampIcon={crm.editStampIcon}
        setEditStampIcon={crm.setEditStampIcon}
        editPushMessage={crm.editPushMessage}
        setEditPushMessage={crm.setEditPushMessage}
        isPushingCard={crm.isPushingCard}
        onSave={crm.handleSaveCardCustomization}
      />

      <BulkBroadcastModal
        isOpen={crm.isBulkBroadcastOpen}
        onClose={() => crm.setIsBulkBroadcastOpen(false)}
        message={crm.bulkPushMessage}
        setMessage={crm.setBulkPushMessage}
        isSending={crm.isSendingBulk}
        onSend={crm.handleSendBulkBroadcast}
      />
    </div>
  );
};
