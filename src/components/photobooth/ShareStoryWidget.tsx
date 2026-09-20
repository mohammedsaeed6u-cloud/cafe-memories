'use client';

import React, { useState } from 'react';
import { Share2, Download, Camera, Sparkles, Check, Copy } from 'lucide-react';

interface ShareStoryWidgetProps {
  stripDataUrl?: string;
  brandName?: string;
  cafeHandle?: string;
}

export const ShareStoryWidget: React.FC<ShareStoryWidgetProps> = ({
  stripDataUrl,
  brandName = 'Memories',
  cafeHandle = '@espresso-lab',
}) => {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 1. Download HD Image
  const handleDownload = () => {
    if (!stripDataUrl) return;
    const a = document.createElement('a');
    a.href = stripDataUrl;
    a.download = `memories-strip-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          text: `أحلى لحظات فوتوبوث في ${brandName} ${cafeHandle} ✨☕ #Memories #Photobooth`,
          files: [file],
        });
      } else {
        // Fallback: Download and copy caption
        handleDownload();
        await navigator.clipboard.writeText(
          `أحلى لحظات فوتوبوث في ${brandName} ${cafeHandle} ✨☕ #Memories #Photobooth`
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
        {/* Download HD Button */}
        <button
          onClick={handleDownload}
          className="py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs border border-stone-300 shadow-sm transition flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>تحميل الشريط (HD)</span>
        </button>

        {/* Share to Story Button */}
        <button
          onClick={handleShareStory}
          disabled={isSharing}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <Camera className="w-4 h-4" />
          <span>مشاركة على الستوري 📸</span>
        </button>
      </div>

      {copiedNotice && (
        <div className="p-2.5 bg-pink-50 border border-pink-200 text-pink-900 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4 text-pink-600" />
          <span>تم تنزيل الصورة ونسخ الهاشتاج والمنشن لنشرها على ستوري إنستجرام!</span>
        </div>
      )}
    </div>
  );
};
