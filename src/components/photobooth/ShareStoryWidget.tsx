'use client';

import React, { useState } from 'react';
import { Share2, Download, Camera, Sparkles, Check, Copy, Lock } from 'lucide-react';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from './IosSaveImageModal';

interface ShareStoryWidgetProps {
  stripDataUrl?: string;
  brandName?: string;
  cafeHandle?: string;
  isCardComplete?: boolean;
  completedShots?: number;
  totalShots?: number;
}

export const ShareStoryWidget: React.FC<ShareStoryWidgetProps> = ({
  stripDataUrl,
  brandName = 'Memories',
  cafeHandle = '@memories_studio',
  isCardComplete = false,
  completedShots = 1,
  totalShots = 3,
}) => {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  const remaining = Math.max(totalShots - completedShots, 1);

  // 1. Download HD Image (Only allowed if card is 100% complete)
  const handleDownload = async () => {
    if (!isCardComplete) {
      setLockedNotice(true);
      setTimeout(() => setLockedNotice(false), 4000);
      return;
    }
    if (!stripDataUrl) return;

    const result = await ImageSaveService.saveImage({
      dataUrl: stripDataUrl,
      filename: `memories-strip-${Date.now()}.png`,
      title: `ذكرياتي في ${brandName}`,
    });

    if (result.method === 'fallback') {
      setIosModalOpen(true);
    }
  };

  // 2. Share to Story via Web Share API
  const handleShareStory = async () => {
    if (!stripDataUrl) return;
    setIsSharing(true);

    try {
      // Convert dataUrl to File for Web Share API
      const res = await fetch(stripDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'memories-story.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ذكرياتي في ${brandName}`,
          text: `أحلى لحظات فوتوبوث في ${brandName} ${cafeHandle} #Memories #Photobooth`,
          files: [file],
        });
      } else {
        // Fallback: Copy caption
        await navigator.clipboard.writeText(
          `أحلى لحظات فوتوبوث في ${brandName} ${cafeHandle} #Memories #Photobooth`
        );
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3500);
      }
    } catch (err) {
      console.warn('Share cancelled or not supported', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Download HD Button (Strictly Gated) */}
        {isCardComplete ? (
          <button
            onClick={handleDownload}
            className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تحميل الكارت المكتمل (HD)</span>
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-stone-500 font-bold text-[11px] border border-stone-200 transition flex items-center justify-center gap-1.5"
            title="التحميل مقفول حتى إكمال الكارت"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">تحميل HD مقفول ({remaining} متبقية)</span>
          </button>
        )}

        {/* Share to Story Button */}
        <button
          onClick={handleShareStory}
          disabled={isSharing}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <Camera className="w-4 h-4" />
          <span>مشاركة على الستوري</span>
        </button>
      </div>

      {lockedNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            التحميل عالي الدقة مقفول! اطلب مجدداً واجمع باقي الصور ({remaining} صور متبقية) لإلغاء القفل وتحميل الكارت بدقة عالية.
          </span>
        </div>
      )}

      {copiedNotice && (
        <div className="p-2.5 bg-pink-50 border border-pink-200 text-pink-900 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4 text-pink-600" />
          <span>تم نسخ الهاشتاج والمنشن لنشرها على ستوري إنستجرام!</span>
        </div>
      )}

      {/* Safari / iOS Save Image Sheet Modal */}
      <IosSaveImageModal
        open={iosModalOpen}
        imageUrl={stripDataUrl || null}
        filename="memories-strip.png"
        onClose={() => setIosModalOpen(false)}
      />
    </div>
  );
};
