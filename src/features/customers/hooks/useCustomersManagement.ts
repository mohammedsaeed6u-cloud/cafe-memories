'use client';

import { useState } from 'react';
import { CustomerRecord } from '../types';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { CooldownService } from '@/lib/services/cooldown.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';

export function useCustomersManagement(
  customers: CustomerRecord[],
  cafeSlug: string,
  requiredVisits: number,
  brandName: string,
  cafeLogoUrl?: string,
  onRefresh?: () => void
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'regular' | 'frequent'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustRole, setNewCustRole] = useState('coffee_lover');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Order shots modal state
  const [orderModalCustomer, setOrderModalCustomer] = useState<CustomerRecord | null>(null);
  const [shotsToAdd, setShotsToAdd] = useState<number>(1);

  // Card update modal state
  const [cardUpdateCustomer, setCardUpdateCustomer] = useState<CustomerRecord | null>(null);
  const [editStampsCount, setEditStampsCount] = useState<number>(1);
  const [editGiftTitle, setEditGiftTitle] = useState<string>('كوب سبيشالتي مجاني');
  const [editColorHex, setEditColorHex] = useState<string>('#231C18');
  const [editStampIcon, setEditStampIcon] = useState<string>('☕');
  const [editPushMessage, setEditPushMessage] = useState<string>('');
  const [isPushingCard, setIsPushingCard] = useState<boolean>(false);

  // Bulk broadcast state
  const [isBulkBroadcastOpen, setIsBulkBroadcastOpen] = useState(false);
  const [bulkPushMessage, setBulkPushMessage] = useState('');
  const [bulkColorHex, setBulkColorHex] = useState('#231C18');
  const [bulkStampIcon, setBulkStampIcon] = useState('☕');
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopyPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    showToast(`تم نسخ رقم (${phone}) للحافظة`, 'info');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleUnlockCooldown = (phone?: string, name?: string) => {
    if (!phone) return;
    CooldownService.unlockForCustomer(phone, cafeSlug);
    showToast(`تم فك قفل الزيارات (24 ساعة) للعميل (${name || phone}) بنجاح!`);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPhone.trim()) return;

    const phoneToRegister = newCustPhone.trim();
    const nameToRegister = newCustName.trim() || `عميل ${phoneToRegister.slice(-4)}`;

    CustomerRegistryService.registerCustomer(
      phoneToRegister,
      nameToRegister,
      newCustRole,
      cafeSlug
    );

    // Persist new customer profile to Supabase Cloud
    fetch('/api/v1/loyalty/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerPhone: phoneToRegister,
        cafeSlug,
        customerName: nameToRegister,
        count: 0,
      }),
    }).catch((err) => console.warn('Failed to register customer in cloud:', err));

    setIsAddModalOpen(false);
    setNewCustPhone('');
    setNewCustName('');
    showToast('تمت إضافة العميل إلى سجل الولاء بنجاح!');
    onRefresh?.();
  };

  const openCardUpdateModal = (customer: CustomerRecord) => {
    setCardUpdateCustomer(customer);
    setEditStampsCount(customer.totalVisits % (requiredVisits || 5));
    setEditGiftTitle('كوب سبيشالتي مجاني');
    setEditColorHex('#231C18');
    setEditStampIcon('☕');
    setEditPushMessage(`☕ تم تحديث كارت الولاء الخاص بك في ${brandName}! تفقد رصيدك الجديد.`);
  };

  const handleSaveCardCustomization = async () => {
    if (!cardUpdateCustomer || !cardUpdateCustomer.phone) return;
    setIsPushingCard(true);

    try {
      const res = await DigitalWalletService.updateCustomerCardComprehensive({
        cafeSlug,
        customerPhone: cardUpdateCustomer.phone,
        customerName: cardUpdateCustomer.displayName,
        stampedCount: editStampsCount,
        maxSlots: requiredVisits,
        giftTitle: editGiftTitle,
        colorHex: editColorHex,
        stampIcon: editStampIcon,
        pushMessage: editPushMessage.trim() || undefined,
        logoUrl: cafeLogoUrl,
        cafeName: brandName,
        cardBackgroundUrl: BusinessSettingsService.getSettings(cafeSlug)?.walletPassConfig?.cardBackgroundUrl,
      });

      if (res.success) {
        showToast(`تم تحديث كارت العميل (${cardUpdateCustomer.displayName}) وبث الإشعار للمحفظة فوراً! 📱✨`);
        setCardUpdateCustomer(null);
        onRefresh?.();
      } else {
        showToast(res.error || 'تعذر تحديث الكارت، يرجى المحاولة لاحقاً', 'info');
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بخادم المحفظة', 'info');
    } finally {
      setIsPushingCard(false);
    }
  };

  const handleSendBulkBroadcast = async () => {
    if (!bulkPushMessage.trim()) return;
    setIsSendingBulk(true);

    try {
      const res = await DigitalWalletService.broadcastVenueNotification(
        bulkPushMessage.trim(),
        cafeSlug
      );

      showToast(
        `تم بث الإشعار بنجاح إلى ${res.notifiedDevices || 0} جهاز عبر Apple Push Notifications!`
      );
      setIsBulkBroadcastOpen(false);
      setBulkPushMessage('');
    } catch {
      showToast('حدث خطأ أثناء بث الإشعار للمحافظ', 'info');
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.displayName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.role && c.role.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filter === 'vip') return c.totalVisits >= 5 || c.role === 'vip';
    if (filter === 'frequent') return c.totalVisits >= 3;
    if (filter === 'regular') return c.totalVisits < 3;
    return true;
  });

  return {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    isAddModalOpen,
    setIsAddModalOpen,
    newCustPhone,
    setNewCustPhone,
    newCustName,
    setNewCustName,
    newCustRole,
    setNewCustRole,
    toast,
    copiedPhone,
    orderModalCustomer,
    setOrderModalCustomer,
    shotsToAdd,
    setShotsToAdd,
    cardUpdateCustomer,
    setCardUpdateCustomer,
    editStampsCount,
    setEditStampsCount,
    editGiftTitle,
    setEditGiftTitle,
    editColorHex,
    setEditColorHex,
    editStampIcon,
    setEditStampIcon,
    editPushMessage,
    setEditPushMessage,
    isPushingCard,
    isBulkBroadcastOpen,
    setIsBulkBroadcastOpen,
    bulkPushMessage,
    setBulkPushMessage,
    bulkColorHex,
    setBulkColorHex,
    bulkStampIcon,
    setBulkStampIcon,
    isSendingBulk,
    filteredCustomers,
    showToast,
    handleCopyPhone,
    handleUnlockCooldown,
    handleAddCustomerSubmit,
    openCardUpdateModal,
    handleSaveCardCustomization,
    handleSendBulkBroadcast,
  };
}
