import {
  BusinessSettings,
  BusinessType,
  StampCustomType,
  StampShapeStyle,
} from '@/types/photobooth';

export interface DashboardSettingsTabProps {
  settings: BusinessSettings;
  onSettingsUpdated: (updated: BusinessSettings) => void;
  onOpenQuickSetup: () => void;
}

export interface InkPalette {
  id: string;
  label: string;
  hex: string;
}

export interface StampShapeOption {
  id: StampShapeStyle;
  label: string;
  icon: string;
}

export const CURATED_STAMP_EMOJIS = ['☕', '🥐', '🌸', '⭐', '🌿', '💎', '🍓', '🍕', '🤍', '👑', '✨', '🎯', '🚀', '🎪'];

export const INK_PALETTES: InkPalette[] = [
  { id: 'espresso', label: 'إسبريسو فاخر', hex: '#231C18' },
  { id: 'burgundy', label: 'عنابي ملكي', hex: '#8B2635' },
  { id: 'vintage_gold', label: 'ذهب عتيق', hex: '#C88A58' },
  { id: 'forest_green', label: 'أخضر غابات', hex: '#2D4A3E' },
  { id: 'navy_heritage', label: 'كحلي كلاسيكي', hex: '#1B365D' },
  { id: 'terracotta', label: 'تيراكوتا دافئ', hex: '#9E4733' },
];

export const STAMP_SHAPES: StampShapeOption[] = [
  { id: 'circle', label: 'دائري كلاسيكي', icon: '⭕' },
  { id: 'square', label: 'مثمن هندسي', icon: '🛑' },
  { id: 'vintage_seal', label: 'ختم شمعي ملكي', icon: '🏵️' },
  { id: 'postal_stamp', label: 'طابع بريدي مسنن', icon: '✉️' },
];

export const NOTIFICATION_TEMPLATES = [
  '☕ عرض اليوم: استمتع بقهوتك المفضلة اليوم مجاناً عند زيارة الفرع!',
  '⭐ متبقي لك ختم واحد فقط لفتح هديتك الحصرية، بانتظارك!',
  '🎁 تم تجديد قائمة المكافآت والحلويات الحصرية، نسعد بزيارتك!',
  '🌸 عطلة نهاية أسبوع سعيدة! استمتع بختم إضافي اليوم مع كل طلب.',
];

export interface UseDashboardSettingsReturn {
  settings: BusinessSettings;
  businessType: BusinessType;
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType>>;
  businessName: string;
  setBusinessName: React.Dispatch<React.SetStateAction<string>>;
  tagline: string;
  setTagline: React.Dispatch<React.SetStateAction<string>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  showLogo: boolean;
  setShowLogo: React.Dispatch<React.SetStateAction<boolean>>;
  shotCount: number;
  setShotCount: React.Dispatch<React.SetStateAction<number>>;
  giftTitle: string;
  setGiftTitle: React.Dispatch<React.SetStateAction<string>>;
  giftSubtitle: string;
  setGiftSubtitle: React.Dispatch<React.SetStateAction<string>>;
  stampType: StampCustomType;
  setStampType: React.Dispatch<React.SetStateAction<StampCustomType>>;
  customEmoji: string;
  setCustomEmoji: React.Dispatch<React.SetStateAction<string>>;
  stampLogoUrl: string;
  setStampLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  knockoutLogo: boolean;
  setKnockoutLogo: React.Dispatch<React.SetStateAction<boolean>>;
  inkColor: string;
  setInkColor: React.Dispatch<React.SetStateAction<string>>;
  stampShape: StampShapeStyle;
  setStampShape: React.Dispatch<React.SetStateAction<StampShapeStyle>>;
  connectedPassesCount: number;
  notificationMsg: string;
  setNotificationMsg: React.Dispatch<React.SetStateAction<string>>;
  isSendingNotif: boolean;
  notifResult: { success: boolean; message: string } | null;
  saveSuccess: boolean;
  activeIndustry: any;
  handleSelectIndustry: (typeId: BusinessType) => void;
  handleSave: () => void;
  handleBroadcastNotification: () => Promise<void>;
}
