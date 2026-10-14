/**
 * Customer studio presets — pill selectors data for the customer photobooth.
 * Extracted from CustomerClient to keep the client shell purely compositional.
 */

export interface CustomerThemePill {
  id: string;
  label: string;
  icon: string;
}

export const CUSTOMER_STUDIO_THEME_PILLS: CustomerThemePill[] = [
  { id: 'atelier_scrapbook', label: 'سكراب بوك كلاسيكي', icon: '✂️' },
  { id: 'luxury_glass', label: 'جلاسي فاخر (Luxury Glass)', icon: '💎' },
  { id: 'polaroid_vintage', label: 'بولارويد كلاسيك', icon: '🎞️' },
  { id: 'korean_noir', label: 'نوار كوري عاجي', icon: '☕' },
  { id: 'ticket_express', label: 'تذكرة الزيارة', icon: '🎟️' },
  { id: 'ios_camera', label: 'كاميرا آيفون', icon: '📷' },
  { id: 'spotify_player', label: 'مشغل سبوتيفاي', icon: '🎵' },
  { id: 'ios_gallery_light', label: 'ألبوم آيفون', icon: '🖼️' },
  { id: 'ios_imessage', label: 'آي مسج', icon: '💬' },
];

export const SPOTIFY_BG_PRESETS = [
  { id: '#384C5A', name: 'Slate Blue', hex: '#384C5A' },
  { id: '#4E483E', name: 'Warm Taupe', hex: '#4E483E' },
  { id: '#161618', name: 'Charcoal', hex: '#161618' },
  { id: '#8B3A2B', name: 'Terracotta', hex: '#8B3A2B' },
];

export const SPOTIFY_TRACK_PRESETS = [
  { title: 'Morning Coffee', artist: 'Lofi Cafe Beats' },
  { title: 'Nobody Gets Me', artist: 'SZA • SOS' },
  { title: 'صباح ومساء', artist: 'فيروز' },
  { title: 'Golden Hour', artist: 'JVKE' },
  { title: 'نسم علينا الهوى', artist: 'فيروز' },
];

export const TICKET_SEAT_PRESETS: string[] = [
  'طاولة 04 • صالة',
  'جلسة VIP',
  'ركن الاستقبال',
  'الفرع الرئيسي',
];
