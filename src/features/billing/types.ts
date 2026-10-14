import {
  SubscriptionPlan,
  SubscriptionPlanId,
  TenantSubscription,
  InvoiceRecord,
} from '@/types/subscription';

export interface SubscriptionBillingTabProps {
  cafeSlug: string;
}

export interface UseSubscriptionBillingReturn {
  subscription: TenantSubscription;
  invoices: InvoiceRecord[];
  plans: SubscriptionPlan[];
  notification: string | null;
  isChangingCard: boolean;
  setIsChangingCard: React.Dispatch<React.SetStateAction<boolean>>;
  selectedInvoice: InvoiceRecord | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<InvoiceRecord | null>>;
  isCancelConfirmOpen: boolean;
  setIsCancelConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cardHolder: string;
  setCardHolder: React.Dispatch<React.SetStateAction<string>>;
  cardNumber: string;
  setCardNumber: React.Dispatch<React.SetStateAction<string>>;
  expiry: string;
  setExpiry: React.Dispatch<React.SetStateAction<string>>;
  cardBrand: 'mada' | 'visa' | 'mastercard';
  setCardBrand: React.Dispatch<React.SetStateAction<'mada' | 'visa' | 'mastercard'>>;
  activePlan: SubscriptionPlan;
  isAnnual: boolean;
  visitsLimit: number | 'unlimited';
  visitsUsed: number;
  visitsPercent: number;
  screensLimit: number | 'unlimited';
  screensUsed: number;
  printsLimit: number | 'unlimited';
  printsUsed: number;
  printsPercent: number;
  formatDate: (isoStr: string) => string;
  handleToggleInterval: () => void;
  handleUpgradePlan: (planId: SubscriptionPlanId) => void;
  handleSaveCard: (e: React.FormEvent) => void;
  handleToggleCancel: () => void;
}
