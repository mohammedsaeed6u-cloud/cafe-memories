'use client';

import React from 'react';
import { Palette, QrCode, Upload, Trash2, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { WalletColorPreset, WalletBarcodeFormat } from '@/types/photobooth';
import { CURATED_CARD_PRESETS } from '@/lib/services/card-image.service';

interface WalletDesignCustomizerProps {
  colorPreset: WalletColorPreset;
  setColorPreset: (p: WalletColorPreset) => void;
  colorHex: string;
  setColorHex: (hex: string) => void;
  barcodeFormat: WalletBarcodeFormat;
  setBarcodeFormat: (fmt: WalletBarcodeFormat) => void;
  cardBackgroundUrl?: string;
  setCardBackgroundUrl: (url?: string) => void;
  cardOverlayOpacity: number;
  setCardOverlayOpacity: (op: number) => void;
  cardPresetId?: string;
  setCardPresetId: (id?: string) => void;
  isProcessingImage: boolean;
  imageSuccessMsg: string | null;
  imageError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sharingProhibited: boolean;
  setSharingProhibited: (val: boolean) => void;
}

export function WalletDesignCustomizer({
  colorPreset,
  setColorPreset,
  colorHex,
  setColorHex,
  barcodeFormat,
  setBarcodeFormat,
  cardBackgroundUrl,
  setCardBackgroundUrl,
  cardOverlayOpacity,
  setCardOverlayOpacity,
  cardPresetId,
  setCardPresetId,
  isProcessingImage,
  imageSuccessMsg,
  imageError,
  fileInputRef,
  onImageUpload,
  sharingProhibited,
  setSharingProhibited,
}: WalletDesignCustomizerProps) {
  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs space-y-6">
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.1)]/60 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center">
          <Palette className="w-5 h-5 text-[#c92a54]" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#FBF9F5]">
            🎨 هوية وتصميم كارت المحفظة (Apple & Google Pass Styling)
          </h3>
          <p className="text-xs text-stone-500">
            ألوان البطاقة، خلفية البراند المخصصة، ونوع الباركود المعتمد في أنظمة الكاشير
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#FBF9F5]">
            لون بطاقة المحفظة الأساسي:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dark', label: 'داكن فاخر', bg: 'bg-[#FBF9F5]', text: 'text-white', hex: '#FBF9F5' },
              { id: 'blue', label: 'أزرق كحلي', bg: 'bg-[#1E3A8A]', text: 'text-white', hex: '#1E3A8A' },
              { id: 'green', label: 'أخضر زمردي', bg: 'bg-[#064E3B]', text: 'text-white', hex: '#064E3B' },
              { id: 'red', label: 'عنابي دافئ', bg: 'bg-[#881337]', text: 'text-white', hex: '#881337' },
              { id: 'purple', label: 'بنفسجي ملكي', bg: 'bg-[#581C87]', text: 'text-white', hex: '#581C87' },
              { id: 'orange', label: 'برتقالي كهرماني', bg: 'bg-[#7C2D12]', text: 'text-white', hex: '#7C2D12' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setColorPreset(preset.id as WalletColorPreset);
                  setColorHex(preset.hex);
                }}
                className={`p-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${preset.bg} ${preset.text} ${
                  colorPreset === preset.id ? 'ring-2 ring-offset-2 ring-[#c92a54] shadow-sm' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-10 h-10 rounded-xl border border-[rgba(255,255,255,0.1)] cursor-pointer"
            />
            <input
              type="text"
              dir="ltr"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-32 px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] font-mono font-bold uppercase focus:border-[#c92a54] focus:outline-none"
              placeholder="#FBF9F5"
            />
            <span className="text-[11px] text-stone-500">كود اللون HEX المعتمد</span>
          </div>
        </div>

        {/* Barcode format */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#FBF9F5]">
            نوع الباركود المطبوع على ظهر الكارت (Scanner Format):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'QR', label: 'رمز الاستجابة السريع QR', sub: 'الأسرع مع الكاميرا والموبايل' },
              { id: 'PDF417', label: 'باركود PDF417', sub: 'المعتمد في تذاكر الطيران' },
              { id: 'Aztec', label: 'باركود Aztec', sub: 'مساحة صغيرة ودقة عالية' },
              { id: 'Code128', label: 'كود 128 الشريطي', sub: 'لقارئات الباركود الليزرية القديمة' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setBarcodeFormat(fmt.id as WalletBarcodeFormat)}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                  barcodeFormat === fmt.id
                    ? 'border-[#c92a54] bg-amber-50/50 shadow-xs'
                    : 'border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FBF9F5]">{fmt.label}</span>
                  <QrCode className={`w-4 h-4 ${barcodeFormat === fmt.id ? 'text-[#c92a54]' : 'text-stone-400'}`} />
                </div>
                <span className="text-[10px] text-stone-500 block">{fmt.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card Background Customization */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.1)]/60 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c92a54]" />
            <span>خلفية الكارت الفاخرة (Card Background & Artwork)</span>
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            ارفع صورة هوية المقهى أو اختر من تصاميم ستامبي الفاخرة لكروت Apple Wallet و Google Wallet بمقاس 690×1010
          </p>
        </div>

        {/* Upload Custom Image */}
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            ref={fileInputRef as any}
            accept="image/png,image/jpeg,image/webp"
            onChange={onImageUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={isProcessingImage}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>{isProcessingImage ? 'جاري المعالجة والضغط...' : 'رفع صورة خلفية للبراند (690×1010)'}</span>
          </button>

          {cardBackgroundUrl && (
            <button
              type="button"
              onClick={() => {
                setCardBackgroundUrl(undefined);
                setCardPresetId(undefined);
              }}
              className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إزالة الخلفية</span>
            </button>
          )}

          {imageSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              {imageSuccessMsg}
            </span>
          )}
          {imageError && (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 animate-in fade-in">
              {imageError}
            </span>
          )}
        </div>

        {/* Curated Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-stone-600 block">أو اختر من تصاميم ستامبي الجاهزة:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CURATED_CARD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setCardPresetId(preset.id);
                  setCardBackgroundUrl(preset.backgroundUrl);
                  setCardOverlayOpacity(preset.recommendedOverlayOpacity);
                }}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer relative overflow-hidden ${
                  cardPresetId === preset.id
                    ? 'border-[#c92a54] bg-amber-50/40 ring-2 ring-amber-500 shadow-xs'
                    : 'border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A]'
                }`}
              >
                <div
                  className="w-full h-16 rounded-xl mb-2 bg-cover bg-center border border-stone-200"
                  style={{ backgroundImage: `url(${preset.thumbnailUrl})` }}
                />
                <span className="text-xs font-bold text-[#FBF9F5] block truncate">{preset.nameAr}</span>
                <span className="text-[10px] text-stone-500 block truncate">{preset.nameEn}</span>
                {cardPresetId === preset.id && (
                  <div className="absolute top-2 left-2 p-1 rounded-full bg-[#c92a54] text-white shadow-xs">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity slider */}
        {cardBackgroundUrl && (
          <div className="space-y-2 max-w-sm pt-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#FBF9F5]">شفافية الطبقة الداكنة فوق الخلفية (Dark Overlay):</span>
              <span className="font-mono text-[#c92a54]">{Math.round(cardOverlayOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={cardOverlayOpacity}
              onChange={(e) => setCardOverlayOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#c92a54]"
            />
            <span className="text-[10px] text-stone-400 block">
              تضمن وضوح النصوص البيضاء فوق الصور الفاتحة لكروت Apple Wallet
            </span>
          </div>
        )}
      </div>

      {/* Security & Anti-Fraud */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.1)]/60">
        <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl bg-[#141212] border border-[rgba(255,255,255,0.1)] hover:bg-white transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#FBF9F5] block">
                حظر إعادة مشاركة الكارت (sharingProhibited = true)
              </span>
              <span className="text-[11px] text-stone-500">
                يمنع العميل من إرسال كارت الولاء عبر AirDrop أو الرسائل لمنع الاحتيال في الأختام
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sharingProhibited}
            onChange={(e) => setSharingProhibited(e.target.checked)}
            className="w-5 h-5 accent-[#c92a54] cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
