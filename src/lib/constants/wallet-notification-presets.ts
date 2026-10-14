/**
 * Shared wallet broadcast message templates — single source of truth for the
 * merchant-side surfaces that push notifications to installed wallet passes:
 * the dashboard Wallet command center and the staff-facing notification modal.
 * Keeping them in one module guarantees consistent brand voice and makes the
 * template set unit-testable.
 */

/** Lock-screen "relevantText" presets (concise, shown at ~100m geofence). */
export const LOCKSCREEN_MESSAGE_PRESETS: string[] = [
  '☕ أهلاً بك في ضيافتنا! كارتك جاهز للختم والمكافأة بانتظارك',
  '⭐ أهلاً بعودتك! امسح الكارت عند الكاشير للحصول على ختم زيارتك اليوم',
  '🎁 اقتربت من هديتك! استمتع بمشروبك واحصل على ختمك المباشر',
];

/** Push-broadcast presets (marketing/welcome messages sent to all passes). */
export const WALLET_BROADCAST_TEMPLATES: string[] = [
  '☕ عرض اليوم الحصري: احصل على خصم 20% على قهوتك المفضلة اليوم!',
  '⭐ متبقي لك ختم واحد فقط لفتح هديتك الحصرية، بانتظارك في الفرع!',
  '🎁 تم إضافة مكافأة خاصة لحاملي كروت الولاء، نسعد بزيارتكم!',
  '🌸 عطلة نهاية أسبوع سعيدة! استمتع بختم إضافي اليوم مع كل طلب.',
];

/** Staff-modal quick presets (occasion messages for loyal customers). */
export const STAFF_NOTIFICATION_PRESETS: string[] = [
  '☕ قهوتك القادمة علينا بمناسبة عطلة نهاية الأسبوع! تفضل بزيارتنا ✨',
  '🎁 مبروك! أضفنا ختماً إضافياً لكارت ذكرياتك تقديراً لوفائك',
  '🥐 كرواسون طازج مجاني بانتظارك مع فنجان قهوتك المفضل اليوم',
  '✨ خصم خاص 20% لعملاء برنامج الولاء حتى الساعة 8 مساءً',
];
