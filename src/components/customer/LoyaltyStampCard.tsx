'use client';

import React, { useMemo } from 'react';
import { Coffee, Gift, Printer, Share2, Sparkles } from 'lucide-react';
import {
  LOYALTY_TOTAL_SLOTS,
  getStampState,
  mapLocalPhotosToSlots,
  type LoyaltyStampSlot,
} from '@/lib/services/loyalty-stamps';
import { PrintService } from '@/lib/services/print.service';

interface LoyaltyStampCardProps {
  /** Stamp slots from the server; falls back to local photos when empty. */
  slots: LoyaltyStampSlot[];
  /** Local accumulated photos (data URLs) used when cloud is unavailable. */
  localPhotos?: string[];
  brandName?: string;
  customerName?: string;
  /** Random-ish tilts stay stable per card by seeding on slot index. */
  giftReady?: boolean;
  onClaimGift?: () => void;
}

const TILTS = [-6, 4, -3, 7, -5, 5, -7, 3, -4, 6];

export const LoyaltyStampCard: React.FC<LoyaltyStampCardProps> = ({
  slots,
  localPhotos = [],
  brandName = 'Memories',
  customerName,
  giftReady,
  onClaimGift,
}) => {
  const effectiveSlots = useMemo<LoyaltyStampSlot[]>(
    () => (slots.length > 0 ? slots : mapLocalPhotosToSlots(localPhotos)),
    [slots, localPhotos]
  );

  const state = useMemo(() => getStampState(effectiveSlots), [effectiveSlots]);
  const isGiftReady = giftReady ?? state.isComplete;
  const latestIndex = state.stampedCount - 1;

  const handleShare = async () => {
    if (effectiveSlots.length === 0) return;
    try {
      const canvas = await composeCardImage(effectiveSlots, brandName, customerName);
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'memories-loyalty-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `كارت ولائي في ${brandName}`,
          text: `كارت ذكرياتي في ${brandName} ✦ ${state.stampedCount}/${LOYALTY_TOTAL_SLOTS} ختم ✨ #Memories`,
          files: [file],
        });
        return;
      }
      // Fallback: download the composed card.
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'memories-loyalty-card.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Card share cancelled or failed', err);
    }
  };

  const handlePrint = async () => {
    if (effectiveSlots.length === 0) return;
    try {
      const canvas = await composeCardImage(effectiveSlots, brandName, customerName);
      PrintService.printStripImage(canvas.toDataURL('image/png'));
    } catch (err) {
      console.warn('Card print failed', err);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#FFFDF8] to-[#F7EFE2] rounded-3xl p-5 shadow-lg border border-[#E6DDD0] relative overflow-hidden select-none">
      {/* Corner brand accents */}
      <div className="absolute top-3 left-4 text-[#C9A227] text-lg" aria-hidden>✦</div>
      <div className="absolute bottom-3 right-4 text-[#C9A227] text-lg" aria-hidden>✦</div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-dashed border-[#D8CBB6]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#1C130D] text-[#F7EFE2] flex items-center justify-center shadow-sm">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#1C130D]">
              كارت ولاء {brandName}
            </h4>
            <p className="text-[10px] text-[#8C6B47] font-semibold">
              {customerName ? `كارت ${customerName} • ` : ''}صورة لكل زيارة ✦ الخانة الأخيرة هديتك
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full border ${
            isGiftReady
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-[#F1E8D8] text-[#8C6B47] border-[#E0D4BF]'
          }`}
        >
          {state.stampedCount} / {LOYALTY_TOTAL_SLOTS}
        </span>
      </div>

      {/* Stamp grid — 2 rows × 5 */}
      <div className="grid grid-cols-5 gap-2.5 my-4" role="img" aria-label={`كارت الولاء: ${state.stampedCount} من ${LOYALTY_TOTAL_SLOTS} مختوم`}>
        {Array.from({ length: LOYALTY_TOTAL_SLOTS }).map((_, idx) => {
          const slot = effectiveSlots[idx];
          const isStamped = Boolean(slot);
          const isLatest = idx === latestIndex;
          const isGiftSlot = idx === LOYALTY_TOTAL_SLOTS - 1;
          const tilt = TILTS[idx % TILTS.length];

          return (
            <div
              key={idx}
              className={`relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 transition-all ${
                isStamped
                  ? 'border-[#C9A227]/60 bg-white shadow-sm'
                  : 'border-2 border-dashed border-[#D8CBB6] bg-white/40'
              } ${isLatest ? 'loyalty-stamp-in' : ''}`}
            >
              {isStamped ? (
                <div
                  className="absolute inset-1 rounded-xl overflow-hidden shadow-sm border border-[#1C130D]/10"
                  style={{ transform: `rotate(${tilt}deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot!.thumbnailUrl}
                    alt={`ختم الزيارة ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/45 text-white text-[7px] font-bold text-center py-0.5">
                    {formatStampDate(slot!.takenAt)}
                  </span>
                </div>
              ) : isGiftSlot ? (
                <Gift className={`w-5 h-5 ${isGiftReady ? 'text-amber-500' : 'text-[#B49B77]'}`} />
              ) : (
                <Coffee className="w-4 h-4 text-[#C9B896] opacity-70" />
              )}
              <span
                className={`absolute top-1 right-1.5 text-[8px] font-black ${
                  isStamped ? 'text-white/90 drop-shadow' : 'text-[#B49B77]'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer / progress */}
      <div className="mt-1 pt-3 border-t border-dashed border-[#D8CBB6]">
        {isGiftReady ? (
          <div className="bg-gradient-to-l from-amber-500 to-amber-400 rounded-2xl p-3 text-center text-stone-950 shadow-md">
            <p className="font-black text-sm">🎁 كارتك اكتملت — هديتك جاهزة!</p>
            {onClaimGift && (
              <button
                type="button"
                onClick={onClaimGift}
                className="mt-2 w-full py-2 rounded-xl bg-stone-950 text-amber-300 text-xs font-black hover:bg-stone-900 transition"
              >
                اطلب هديتك الآن ✦
              </button>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[#635345] font-semibold text-center leading-relaxed">
            <Sparkles className="inline w-3 h-3 text-[#C9A227] -mt-0.5" />{' '}
            متبقي {state.remaining} {state.remaining === 1 ? 'زيارة' : 'زيارات'} للهدية —
            <span className="text-[#8C6B47]"> كل صورة ختم جديد على كارتك</span>
          </p>
        )}
      </div>

      {/* Share / print actions */}
      {effectiveSlots.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1C130D] text-[#F7EFE2] text-xs font-bold hover:bg-[#2A1D14] transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            شارك الكارت
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-[#1C130D] border border-[#E0D4BF] text-xs font-bold hover:bg-[#FAF6EE] transition"
          >
            <Printer className="w-3.5 h-3.5" />
            اطبع الكارت
          </button>
        </div>
      )}
    </div>
  );
};

function formatStampDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** Composes the full stamp card into a shareable canvas image. */
async function composeCardImage(
  slots: LoyaltyStampSlot[],
  brandName: string,
  customerName?: string
): Promise<HTMLCanvasElement> {
  const cell = 150;
  const gap = 14;
  const padding = 32;
  const headerH = 92;
  const footerH = 60;
  const cols = 5;
  const rows = Math.ceil(LOYALTY_TOTAL_SLOTS / cols);
  const width = padding * 2 + cols * cell + (cols - 1) * gap;
  const height = headerH + rows * cell + (rows - 1) * gap + footerH + padding;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Warm paper background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#FFFDF8');
  grad.addColorStop(1, '#F7EFE2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = '#1C130D';
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`كارت ولاء ${brandName}`, width / 2, 46);
  ctx.fillStyle = '#8C6B47';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(customerName ? `${customerName} • كل صورة = ختم` : 'كل صورة = ختم ✦ الخانة الأخيرة هديتك', width / 2, 72);

  const state = getStampState(slots);

  // Slots
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  for (let idx = 0; idx < LOYALTY_TOTAL_SLOTS; idx += 1) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = padding + col * (cell + gap);
    const y = headerH + row * (cell + gap);
    const slot = slots[idx];

    ctx.save();
    roundRectPath(ctx, x, y, cell, cell, 20);

    if (slot) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.clip();
      const img = await loadImage(slot.thumbnailUrl);
      if (img) {
        const tilt = TILTS[idx % TILTS.length] * (Math.PI / 180);
        ctx.translate(x + cell / 2, y + cell / 2);
        ctx.rotate(tilt);
        const side = cell * 0.86;
        ctx.drawImage(img, -side / 2, -side / 2, side, side);
      } else {
        ctx.fillStyle = '#F1E8D8';
        ctx.fillRect(x, y, cell, cell);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 8, y + cell - 26, cell - 16, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText(formatStampDate(slot.takenAt), x + cell / 2, y + cell - 12);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#D8CBB6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#C9B896';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(String(idx + 1).padStart(2, '0'), x + cell / 2, y + cell / 2 + 5);
    }
    ctx.restore();
  }

  // Footer
  ctx.fillStyle = state.isComplete ? '#F59E0B' : '#635345';
  ctx.font = '800 16px system-ui, sans-serif';
  const footerText = state.isComplete
    ? '🎁 كارتك اكتملت — هديتك جاهزة!'
    : `${state.stampedCount} / ${LOYALTY_TOTAL_SLOTS} أختام • متبقي ${state.remaining} للهدية`;
  ctx.fillText(footerText, width / 2, height - padding + 10);

  return canvas;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
