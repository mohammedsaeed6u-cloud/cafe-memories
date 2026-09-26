'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlacedSticker } from '@/types/photobooth';
import { CURATED_STICKER_SET } from '@/lib/constants/photobooth-presets';
import { Sparkles, Trash2, X, Plus, Move } from 'lucide-react';
import { DestructiveConfirmModal } from '@/components/ui/DestructiveConfirmModal';

interface DraggableStickerLayerProps {
  stickers: PlacedSticker[];
  onUpdateStickers: (stickers: PlacedSticker[]) => void;
  isInteractive?: boolean; // If false (e.g. static preview/print), only renders without drag handles
  className?: string;
  cardContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const DraggableStickerLayer: React.FC<DraggableStickerLayerProps> = ({
  stickers,
  onUpdateStickers,
  isInteractive = true,
  className = '',
  cardContainerRef,
}) => {
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [customEmoji, setCustomEmoji] = useState('');
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  // Add new sticker
  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    // Spread position slightly randomly around upper center
    const randomOffset = (Math.random() - 0.5) * 20;
    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji: emoji.trim(),
      x: Math.max(15, Math.min(85, 50 + randomOffset)),
      y: Math.max(15, Math.min(85, 40 + randomOffset)),
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    onUpdateStickers([...stickers, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  // Remove sticker
  const handleRemoveSticker = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUpdateStickers(stickers.filter((s) => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  // Clear all stickers
  const handleClearAll = () => {
    onUpdateStickers([]);
    setActiveStickerId(null);
  };

  // Dragging logic (supports mouse and touch)
  const handleDragStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setDraggingId(id);
    setActiveStickerId(id);
  };

  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (clientX: number, clientY: number) => {
      const container = cardContainerRef?.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const xPercent = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));

      onUpdateStickers(
        stickers.map((s) => (s.id === draggingId ? { ...s, x: xPercent, y: yPercent } : s))
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [draggingId, stickers, cardContainerRef, onUpdateStickers]);

  return (
    <>
      {/* Overlaid Sticker Layer directly on the card */}
      <div
        className={`absolute inset-0 pointer-events-none z-30 overflow-hidden ${className}`}
        onClick={() => setActiveStickerId(null)}
      >
        {stickers.map((s) => {
          const isSelected = isInteractive && activeStickerId === s.id;
          return (
            <div
              key={s.id}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: `translate(-50%, -50%) rotate(${s.rotation || 0}deg)`,
              }}
              onMouseDown={(e) => handleDragStart(s.id, e)}
              onTouchStart={(e) => handleDragStart(s.id, e)}
              className={`absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing transition-transform duration-75 ${
                isSelected ? 'ring-2 ring-[#DD0200] rounded-2xl p-1 bg-[#55100D]/40 shadow-lg scale-110 z-40' : ''
              }`}
              title="اسحب الستيكر لتحريكه في أي مكان على الكارت"
            >
              {/* Sticker Emoji */}
              <span className="text-3xl sm:text-4xl filter drop-shadow-md block leading-none">
                {s.emoji}
              </span>

              {/* Action handle if selected */}
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveSticker(s.id, e)}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-md hover:bg-rose-700 transition"
                  title="حذف الستيكر"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// Sticker Picker Tray Bar (For adding emojis and dragging them)
export const StickerControlTray: React.FC<{
  onAddSticker: (emoji: string) => void;
  stickersCount: number;
  onClearAll: () => void;
  className?: string;
}> = ({ onAddSticker, stickersCount, onClearAll, className = '' }) => {
  const [customEmoji, setCustomEmoji] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmoji.trim()) return;
    onAddSticker(customEmoji.trim());
    setCustomEmoji('');
  };

  return (
    <div className={`w-full bg-[#141212]/95 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#DD0200]" />
          <h4 className="text-xs font-bold text-[#FBF9F5]">
            إضافة ستيكرز وإيموجيز للكارت (قابلة للسحب والتحريك):
          </h4>
        </div>
        {stickersCount > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>مسح الستيكرز ({stickersCount})</span>
          </button>
        )}
      </div>

      <DestructiveConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          onClearAll();
          setIsConfirmModalOpen(false);
        }}
        title="تأكيد مسح جميع الستيكرات"
        description={`هل أنت متأكد من رغبتك في إزالة جميع الملصقات (${stickersCount}) من كارت التصوير؟`}
        confirmLabel="نعم، امسح الستيكرات"
        cancelLabel="إلغاء والاحتفاظ بها"
      />

      {/* Curated quick emoji pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {CURATED_STICKER_SET.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onAddSticker(emoji)}
            className="w-9 h-9 rounded-xl bg-[#0B0A0A] hover:bg-[#55100D]/40 hover:scale-110 active:scale-95 border border-white/10 hover:border-[#DD0200]/50 flex items-center justify-center text-xl transition shrink-0 shadow-2xs cursor-pointer"
            title={`إضافة ${emoji} للكارت`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Custom Emoji Input Form */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1 border-t border-white/10">
        <input
          type="text"
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          placeholder="أو اكتب كود الرمز (مثال: EST, VIP, CAFE)..."
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200] bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50"
        />
        <button
          type="submit"
          disabled={!customEmoji.trim()}
          className="px-3.5 py-2 rounded-xl bg-[#DD0200] hover:bg-[#b00200] text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>إضافة</span>
        </button>
      </form>

      <p className="text-[10px] text-[#A19E9B] font-medium text-center flex items-center justify-center gap-1">
        <Move className="w-3 h-3 text-[#DD0200]" />
        <span>المس أو اسحب أي إيموجي على الكارت لوضعه في الزاوية أو المكان الذي يعجبك!</span>
      </p>
    </div>
  );
};
