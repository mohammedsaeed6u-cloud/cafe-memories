'use client';

import React, { useState } from 'react';
import { PhotoboothResponsiveCard } from '@/features/photobooth/PhotoboothResponsiveCard';
import { PhotoCaptureOrUpload } from '@/features/photobooth/PhotoCaptureOrUpload';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { InstagramMentionPrompt } from '@/features/social/InstagramMentionPrompt';
import {
  CUSTOMER_STUDIO_THEME_PILLS,
  SPOTIFY_BG_PRESETS,
  SPOTIFY_TRACK_PRESETS,
  TICKET_SEAT_PRESETS,
} from '@/features/photobooth/customer-studio-presets';
import { PhotoboothCardMode } from '@/types/photobooth';
import { Sparkles, Download, Award, Tv, CheckCircle2, Gift } from 'lucide-react';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { UseCustomerExperienceReturn } from '../types';

interface Props {
  cx: UseCustomerExperienceReturn;
}

export const CustomerPhotoboothStudioTab: React.FC<Props> = ({ cx }) => {
  const {
    totalCardSlots,
    selectedFrame,
    accumulatedPhotos,
    currentDisplayPhotos,
    cardMode,
    setCardMode,
    spotifyBg,
    setSpotifyBg,
    spotifyTrack,
    setSpotifyTrack,
    ticketSeat,
    setTicketSeat,
    settings,
    stickers,
    setStickers,
    isStickerTrayOpen,
    setIsStickerTrayOpen,
    handleAddSticker,
    handleCommitPhoto,
    handlePrintOrDownload,
    handleWallConsent,
    handleStaffStampSuccess,
    setActiveTab,
    setActiveCaptureSlot,
    setIsCameraModalOpen,
  } = cx;

  const [castSuccessMsg, setCastSuccessMsg] = useState<string | null>(null);
  const [memoryStampGranted, setMemoryStampGranted] = useState(false);

  const handleCastToLiveWall = () => {
    handleWallConsent(true);
    SoundEffectsService.playRewardCelebration();
    const tableText = cx.tableNumber ? ` من طاولة ${cx.tableNumber}` : '';
    setCastSuccessMsg(`صورتك تبث الآن${tableText} على شاشة الصالة الكبيرة! انظر إلى الشاشة 📺✨`);
    setTimeout(() => setCastSuccessMsg(null), 5000);
  };

  const handleClaimMemoryStamp = () => {
    if (memoryStampGranted) return;
    handleStaffStampSuccess();
    SoundEffectsService.playStampChime();
    setMemoryStampGranted(true);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification for Live Wall Cast */}
      {castSuccessMsg && (
        <div className="w-full p-4 rounded-2xl bg-[#682025] border border-[#DFAB56]/60 text-[#FAF5EB] text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#DFAB56] shrink-0" />
          <span>{castSuccessMsg}</span>
        </div>
      )}

      {/* Header Strip: Title and slots badge */}
      <div className="w-full flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#3D2314]">
            شريط الذكريات الكورية (4-Cuts)
          </h2>
          <span className="text-[10px] font-mono text-[#6E4E38] bg-[#FAF5EB] border border-[#DFAB56]/40 px-2.5 py-0.5 rounded-full font-bold">
            {totalCardSlots} لقطات • {selectedFrame.widthCm === 10 ? 'بوستكارد 4×6' : 'شريط 2×6'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#6E4E38] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-pulse" />
          <span>{accumulatedPhotos.length} من {totalCardSlots} لقطات موثقة</span>
        </div>
      </div>

      {/* Hero Photobooth Card */}
      <div className="w-full flex justify-center py-1 animate-in zoom-in-95 duration-200">
        <PhotoboothResponsiveCard
          photos={currentDisplayPhotos}
          frame={{
            ...selectedFrame,
            shotCount: totalCardSlots,
            cardMode,
            bgColor: cardMode === 'spotify_player' ? spotifyBg : selectedFrame.bgColor,
            songTitle: spotifyTrack.title,
            songArtist: spotifyTrack.artist,
            ticketSeat,
          }}
          branding={settings.branding}
          freeGiftOffer={settings.freeGiftOffer}
          cardMode={cardMode}
          stickers={stickers}
          onUpdateStickers={setStickers}
          isStickersInteractive={true}
          onSlotClick={(slotIdx) => {
            setActiveCaptureSlot(slotIdx);
            setIsCameraModalOpen(true);
          }}
          dimensionPreset={selectedFrame.dimensionsPreset || (selectedFrame.widthCm === 10 ? 'grid_4x6' : 'strip_2x6')}
        />
      </div>

      {/* Action: Take Photo Or Upload */}
      <PhotoCaptureOrUpload
        canShoot={true}
        onOpenLiveCamera={() => {
          setActiveCaptureSlot(accumulatedPhotos.length < totalCardSlots ? accumulatedPhotos.length : 0);
          setIsCameraModalOpen(true);
        }}
        onUploadPhoto={(b64) => handleCommitPhoto(b64)}
      />

      {/* POST-CAPTURE EXPERIENCE: CAST TO LIVE WALL & EARN MEMORY STAMP */}
      {accumulatedPhotos.length > 0 && (
        <div className="w-full max-w-md p-4 rounded-3xl bg-[#FAF5EB] border border-[#DFAB56]/40 shadow-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3D2314] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
              بث شريطك وكسب الولاء • Live Actions
            </span>
            <span className="text-[10px] font-bold text-[#682025] bg-[#DFAB56]/20 px-2.5 py-0.5 rounded-full border border-[#DFAB56]/40">
              متصل بالصالة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Cast to TV Wall Button */}
            <button
              type="button"
              onClick={handleCastToLiveWall}
              className="w-full py-2.5 px-3 rounded-xl bg-[#682025] hover:bg-[#52171B] text-[#FAF5EB] font-bold text-xs flex items-center justify-center gap-2 border border-[#DFAB56]/40 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <Tv className="w-4 h-4 text-[#DFAB56]" />
              <span>بث على شاشة الصالة الآن</span>
            </button>

            {/* Claim Memory Stamp */}
            <button
              type="button"
              onClick={handleClaimMemoryStamp}
              disabled={memoryStampGranted}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                memoryStampGranted
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 cursor-default'
                  : 'bg-[#DFAB56] hover:bg-[#C9933B] text-[#3D2314] border-[#DFAB56]/60 shadow-xs cursor-pointer active:scale-[0.98]'
              }`}
            >
              {memoryStampGranted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم احتساب ختم الذكرى!</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 text-[#682025]" />
                  <span>+1 ختم الذكرى بكارتك</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Viral Theme Pills Selector */}
      <div className="w-full space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-stone-700">طابع وإطار الكارت:</span>
          <span className="text-[10px] text-amber-800 font-mono font-bold">THEMES</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
          {CUSTOMER_STUDIO_THEME_PILLS.map((mode) => {
            const isActive = cardMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setCardMode(mode.id as PhotoboothCardMode)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#231C18] text-white border-[#231C18] shadow-xs font-black'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-[#EADBCE]'
                }`}
              >
                <span className="text-sm">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-customizer for Spotify */}
        {cardMode === 'spotify_player' && (
          <div className="p-4 bg-white border border-[#EADBCE] rounded-3xl space-y-3 text-xs shadow-xs text-[#231C18]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-stone-700">لون الخلفية:</span>
              {SPOTIFY_BG_PRESETS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSpotifyBg(c.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                    spotifyBg === c.hex ? 'border-amber-800 ring-1 ring-amber-800 text-[#231C18] bg-amber-50' : 'border-[#EADBCE] text-stone-600 bg-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EADBCE]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">الأغنية المفضلة للكارت:</span>
                <span className="text-[10px] text-amber-800 font-mono font-bold">SPOTIFY DOCK</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {SPOTIFY_TRACK_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => setSpotifyTrack(preset)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                      spotifyTrack.title === preset.title
                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                        : 'bg-white border-[#EADBCE] text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    🎵 {preset.title}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <input
                  type="text"
                  value={spotifyTrack.title}
                  onChange={(e) => setSpotifyTrack((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="اسم الأغنية..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EADBCE] bg-[#FCFAF7] text-[#231C18] focus:border-amber-700 focus:outline-none font-bold"
                />
                <input
                  type="text"
                  value={spotifyTrack.artist}
                  onChange={(e) => setSpotifyTrack((prev) => ({ ...prev, artist: e.target.value }))}
                  placeholder="اسم الفنان / الألبوم..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EADBCE] bg-[#FCFAF7] text-[#231C18] focus:border-amber-700 focus:outline-none font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sub-customizer for Location / Seat */}
        {cardMode === 'ticket_express' && (
          <div className="p-4 bg-white border border-[#EADBCE] rounded-3xl space-y-2 text-xs shadow-xs text-[#231C18]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700">موقع الجلسة أو الركن:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TICKET_SEAT_PRESETS.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setTicketSeat(seat)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition cursor-pointer ${
                      ticketSeat === seat
                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                        : 'bg-white border-[#EADBCE] text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={ticketSeat}
              onChange={(e) => setTicketSeat(e.target.value)}
              placeholder="رقم الطاولة أو الموقع (مثال: طاولة VIP 12 أو الركن 03)..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EADBCE] bg-[#FCFAF7] text-[#231C18] focus:border-amber-700 focus:outline-none font-bold"
            />
          </div>
        )}
      </div>

      {/* Stickers & Doodles Decoration Tray */}
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={() => setIsStickerTrayOpen(!isStickerTrayOpen)}
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-[#EADBCE] text-[#231C18] font-bold text-xs shadow-xs transition flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-800" />
            <span>تزيين الكارت بالملصقات والإيموجي (Stickers &amp; Doodles)</span>
          </div>
          <span className="text-[10px] font-mono text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold uppercase tracking-wider">
            {stickers.length > 0 ? `${stickers.length} ملصق بالكارت` : 'إضافة ملصقات +'}
          </span>
        </button>

        {isStickerTrayOpen && (
          <div className="animate-in fade-in duration-200">
            <StickerControlTray
              onAddSticker={handleAddSticker}
              onClearAll={() => setStickers([])}
              stickersCount={stickers.length}
            />
          </div>
        )}
      </div>

      {/* High Res Download Direct Action */}
      <button
        type="button"
        onClick={handlePrintOrDownload}
        className="w-full max-w-md py-3 px-4 rounded-2xl bg-[#231C18] hover:bg-[#382D27] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        <Download className="w-4 h-4 text-amber-300" />
        <span>تحميل شريط الذكريات عالي الدقة (300 DPI)</span>
      </button>

      {/* Instagram Mention Prompt */}
      <InstagramMentionPrompt
        instagramHandle={settings.branding.instagramHandle || '@stampy_studio'}
        businessName={settings.branding.name}
      />

      {/* Contextual Link to Loyalty */}
      <div className="w-full p-4 rounded-3xl bg-white border border-[#EADBCE] flex items-center justify-between gap-3 text-right shadow-xs mt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 flex items-center justify-center shrink-0 font-bold">
            <Award className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#231C18]">هل أنت من رواد {settings.branding.name}؟</p>
            <p className="text-[11px] text-stone-500">احصل على كارت أختام رقمي في Apple Wallet وافتح هديتك الحصرية</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('loyalty')}
          className="px-4 py-2 rounded-xl bg-[#231C18] hover:bg-[#382D27] text-white font-bold text-xs shrink-0 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
        >
          عرض كارت الولاء
        </button>
      </div>
    </div>
  );
};
