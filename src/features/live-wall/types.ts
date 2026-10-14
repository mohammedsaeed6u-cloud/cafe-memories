export interface WallClientProps {
  screenId: string;
}

export interface WallMemoryItem {
  id: string;
  customerName: string;
  avatarUrl?: string;
  photoUrl: string;
  caption?: string;
  tableNumber?: string;
  visitNumber: number;
  timeFormatted: string;
  createdAt: string;
}

export const DEFAULT_FEATURED_MEMORIES: WallMemoryItem[] = [
  {
    id: 'wall-mem-1',
    customerName: 'سارة عبد الله',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    caption: 'أحلى وقت وتوثيق لحظات لا تُنسى مع سارة ✨',
    visitNumber: 4,
    timeFormatted: 'منذ ١٠ دقائق',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wall-mem-2',
    customerName: 'فيصل وبدر',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    caption: 'احتفال بانتهاء المشروع في مقهانا المفضل!',
    visitNumber: 7,
    timeFormatted: 'منذ ٢٥ دقيقة',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wall-mem-3',
    customerName: 'نورة المنصور',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    caption: 'أجواء استثنائية وتجربة رايقة كالعادة 🤍',
    visitNumber: 3,
    timeFormatted: 'منذ ٤٥ دقيقة',
    createdAt: new Date().toISOString(),
  },
];

export interface UseLiveWallReturn {
  screenId: string;
  isPaired: boolean;
  setIsPaired: React.Dispatch<React.SetStateAction<boolean>>;
  screenPairingCode: string;
  pairedSuccessMsg: string | null;
  memories: WallMemoryItem[];
  currentIndex: number;
  currentMemory: WallMemoryItem;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline: boolean;
  lastSyncTime: string;
  isFullscreen: boolean;
  isBlackout: boolean;
  newMemoryToast: string | null;
  brandName: string;
  brandLogoUrl: string | null;
  cafeSlug: string;
  handleRegenerateCode: () => void;
  toggleFullscreen: () => void;
  fetchApprovedMemories: () => Promise<void>;
}
