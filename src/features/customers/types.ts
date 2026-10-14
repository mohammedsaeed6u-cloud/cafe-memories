'use client';

export interface CustomerRecord {
  id: string;
  displayName: string;
  totalVisits: number;
  lastSeenAt: string;
  memoriesCount: number;
  rewardsCount: number;
  role?: string;
  phone?: string;
  registeredAt?: string;
  photoStripUrl?: string;
}

export const PERSONA_LABELS: Record<string, { label: string; badgeClass: string }> = {
  coffee_lover: { label: 'عشاق القهوة', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
  daily_visitor: { label: 'زائر يومي', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  laptop_worker: { label: 'رواد الأعمال ولابتوب', badgeClass: 'bg-blue-50 text-blue-900 border-blue-200' },
  vip: { label: 'عميل VIP متميز', badgeClass: 'bg-purple-50 text-purple-900 border-purple-200' },
  friend_group: { label: 'مجموعات وأصدقاء', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200' },
};

export const CARD_THEME_PRESETS = [
  { id: 'obsidian', label: 'إسبريسو ملكي', hex: '#231C18', textColor: '#FFFFFF' },
  { id: 'amber', label: 'عنبري دافئ', hex: '#B45309', textColor: '#FFFFFF' },
  { id: 'emerald', label: 'أخضر زمردي', hex: '#064E3B', textColor: '#FFFFFF' },
  { id: 'navy', label: 'كحلي كلاسيكي', hex: '#1E3A8A', textColor: '#FFFFFF' },
  { id: 'terracotta', label: 'تيراكوتا دافئ', hex: '#9E4733', textColor: '#FFFFFF' },
  { id: 'burgundy', label: 'عنابي فاخر', hex: '#831843', textColor: '#FFFFFF' },
];

export const STAMP_ICONS = ['☕', '⭐', '👑', '🥐', '✨', '🎯', '🌿', '💎'];
