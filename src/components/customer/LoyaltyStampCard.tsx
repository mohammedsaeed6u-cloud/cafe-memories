'use client';

import React, { useMemo, useState } from 'react';
import { Gift, Printer, Share2, Sparkles, Download } from 'lucide-react';
import {
  LOYALTY_TOTAL_SLOTS,
  getStampState,
  mapLocalPhotosToSlots,
  type LoyaltyStampSlot,
} from '@/lib/services/loyalty-stamps';
import { PrintService } from '@/lib/services/print.service';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';

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
  const [iosSaveModalImage, setIosSaveModalImage] = useState<string | null>(null);

  const handleShare = async () => {
    if (effectiveSlots.length === 0) return;
    try {
      const canvas = await composeCardImage(effectiveSlots, brandName, customerName);
      const dataUrl = canvas.toDataURL('image/png');
      const saveRes = await ImageSaveService.saveImage({
        dataUrl,
        filename: `loyalty-card-${(customerName || brandName).replace(/\s+/g, '-')}.png`,
        title: `كارت ولائي في ${brandName}`,
        text: `كارت ذكرياتي في ${brandName} • ${state.stampedCount}/${LOYALTY_TOTAL_SLOTS} ختم • Memories`,
      });
      if (saveRes.method === 'fallback') {
        setIosSaveModalImage(saveRes.blobUrl || dataUrl);
      }
    } catch (err) {
      console.warn('Card share/save failed', err);
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
    <div className="lux-sheen lux-paper lux-lift w-full rounded-[1.75rem] p-5 relative overflow-hidden select-none">
      {/* Guilloche-style corner ornaments */}
      <div className="absolute top-2.5 left-3.5 text-[#C9A227] text-xs font-mono font-bold" aria-hidden>NO.</div>
      <div className="absolute bottom-2.5 right-3.5 text-[#C9A227] text-xs font-mono font-bold" aria-hidden>NO.</div>
      {/* Double-frame money-style inner border */}
      <div className="absolute inset-2 rounded-[1.3rem] border border-[#C9A227]/25 pointer-events-none" aria-hidden />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-[#C9A227]/25 relative">
        <div className="flex items-center gap-2.5">
          <div className="lux-hero-badge w-9 h-9 rounded-2xl text-[#F3E18C] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#1C130D] tracking-tight">
              كارت ولاء <span className="lux-gold-text">{brandName}</span>
            </h4>
            <p className="text-[10px] text-[#8C6B47] font-semibold">
              {customerName ? `كارت ${customerName} • ` : ''}صورة لكل زيارة • الخانة الأخيرة هديتك
            </p>
          </div>
        </div>
        <span
          className={`text-[11px] font-black tracking-wider px-3 py-1 rounded-full border font-mono ${
            isGiftReady
              ? 'bg-gradient-to-l from-amber-200 to-amber-100 text-amber-900 border-amber-400 shadow-[0_0_10px_rgba(201,162,39,0.35)]'
              : 'lux-gold-text bg-[#1C130D]/90 border-[#C9A227]/50'
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
              className={`relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all ${
                isStamped
                  ? 'lux-slot-stamped bg-white'
                  : isGiftSlot
                  ? 'lux-slot-gift'
                  : 'lux-slot-empty'
              } ${isLatest ? 'loyalty-stamp-in' : ''}`}
            >
              {isStamped ? (
                <div
                  className="absolute inset-1 rounded-xl overflow-hidden border border-[#1C130D]/10"
                  style={{ transform: `rotate(${tilt}deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot!.thumbnailUrl}
                    alt={`ختم الزيارة ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[7px] font-bold text-center pt-1 pb-0.5">
                    {formatStampDate(slot!.takenAt)}
                  </span>
                  {/* Ink stamp seal ring */}
                  <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full border-[1.5px] border-[#C9A227]/90 bg-white/85 shadow-[0_0_6px_rgba(201,162,39,0.4)] flex items-center justify-center" aria-hidden>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                  </span>
                </div>
              ) : isGiftSlot ? (
                <Gift className={`w-5 h-5 transition-all ${isGiftReady ? 'text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)] scale-110' : 'text-[#B49B77]'}`} />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#C9B896] opacity-50" />
              )}
              <span
                className={`absolute top-1 right-1.5 text-[8px] font-black font-mono ${
                  isStamped ? 'text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]' : 'text-[#B49B77]'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer / progress */}
      <div className="mt-1 pt-3 border-t border-[#C9A227]/25">
        {isGiftReady ? (
          <div className="lux-sheen relative overflow-hidden bg-gradient-to-l from-amber-400 via-amber-300 to-amber-400 rounded-2xl p-3 text-center text-stone-950 shadow-[0_10px_26px_-10px_rgba(245,158,11,0.6)] border border-amber-500/60">
            <p className="font-black text-sm">كارتك اكتملت — هديتك جاهزة!</p>
            {onClaimGift && (
              <button
                type="button"
                onClick={onClaimGift}
                className="lux-cta mt-2 w-full py-2 rounded-xl text-amber-300 text-xs font-black transition"
              >
                اطلب هديتك الآن
              </button>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[#635345] font-semibold text-center leading-relaxed">
            <Sparkles className="inline w-3 h-3 text-[#C9A227] -mt-0.5" />{' '}
            متبقي <span className="font-black text-[#1C130D]">{state.remaining}</span>{' '}
            {state.remaining === 1 ? 'زيارة' : 'زيارات'} للهدية —
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
            className="lux-cta flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[#F3E18C] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>حفظ ومشاركة الكارت</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/90 text-[#1C130D] border border-[#C9A227]/35 text-xs font-bold hover:bg-[#FAF6EE] hover:border-[#C9A227]/60 transition shadow-sm cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>اطبع الكارت</span>
          </button>
        </div>
      )}

      {/* iOS Safari Long-Press Save Image Modal */}
      <IosSaveImageModal
        imageUrl={iosSaveModalImage}
        isOpen={Boolean(iosSaveModalImage)}
        onClose={() => setIosSaveModalImage(null)}
        title="كارت الولاء والأختام"
      />
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
  ctx.fillText(customerName ? `${customerName} • كل صورة = ختم` : 'كل صورة = ختم • الخانة الأخيرة هديتك', width / 2, 72);

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
    ? 'كارتك اكتملت — هديتك جاهزة!'
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
