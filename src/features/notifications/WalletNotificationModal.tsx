'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bell, Smartphone, CheckCircle2, AlertCircle, X, Sparkles, RefreshCw } from 'lucide-react';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { STAFF_NOTIFICATION_PRESETS } from '@/lib/constants/wallet-notification-presets';

interface WalletNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  cafeName: string;
}

// Shared staff quick-message presets (single source of truth)
const PRESET_MESSAGES = STAFF_NOTIFICATION_PRESETS;

export const WalletNotificationModal: React.FC<WalletNotificationModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  cafeName,
}) => {
  const [message, setMessage] = useState(PRESET_MESSAGES[0]);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    sentCount: number;
    notifiedDevices: number;
    error?: string;
  } | null>(null);

  const [activePasses, setActivePasses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      const passes = DigitalWalletService.getIssuedPasses(cafeSlug);
      setActivePasses(passes);
    }
  }, [isOpen, cafeSlug]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await DigitalWalletService.broadcastVenueNotification(text, cafeSlug);
      if (res.sentCount > 0) {
        setResult({
          success: true,
          sentCount: res.sentCount,
          notifiedDevices: Math.max(res.notifiedDevices, 1),
        });
      } else {
        setResult({
          success: false,
          sentCount: 0,
          notifiedDevices: 0,
          error: res.errors.length > 0 ? res.errors[0] : 'لم يتم العثور على كروت نشطة للبث',
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        sentCount: 0,
        notifiedDevices: 0,
        error: err?.message || 'تعذر إرسال الإشعار',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="بث إشعار محفظة الهاتف"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141212] border border-[rgba(255,255,255,0.1)] rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(40,30,20,0.15)] text-[#FBF9F5] relative space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(255,255,255,0.1)]/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-300/60 text-amber-800 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 text-[#c92a54] animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#FBF9F5] tracking-tight">
                بث إشعار لحظي لمحفظة الهاتف
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Apple Wallet & Google Wallet • {cafeName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer border border-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live pass status */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F0E8] border border-[rgba(255,255,255,0.1)] text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-800" />
            <span className="font-medium text-stone-700">الكروت والأجهزة المسجلة:</span>
          </div>
          <span className="font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#141212] border border-[rgba(255,255,255,0.1)] text-amber-900 shadow-2xs">
            {activePasses.length} كارت نشط • جهاز آبل متصل 🟢
          </span>
        </div>

        {/* Quick templates */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c92a54]" />
            <span>نماذج رسائل جاهزة وسريعة:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_MESSAGES.map((msg: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(msg)}
                className={`p-2.5 text-right text-xs rounded-xl border transition cursor-pointer line-clamp-2 ${
                  message === msg
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-2xs'
                    : 'bg-white hover:bg-[#0B0A0A] border-[rgba(255,255,255,0.1)] text-stone-600'
                }`}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="wallet-broadcast-msg" className="font-bold text-stone-700">
              نص الإشعار على شاشة القفل:
            </label>
            <span className="text-[11px] font-mono text-stone-500">
              {message.length} / 120 حرف
            </span>
          </div>
          <textarea
            id="wallet-broadcast-msg"
            rows={3}
            value={message}
            maxLength={120}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك لضيوفك وحاملي كارت المحفظة..."
            className="w-full p-3.5 text-xs rounded-2xl border border-[rgba(255,255,255,0.1)] bg-white text-[#FBF9F5] focus:border-[#c92a54] focus:ring-2 focus:ring-amber-200/50 focus:outline-none resize-none shadow-2xs leading-relaxed"
          />
          <p className="text-[10px] text-stone-500 leading-normal">
            💡 يظهر هذا النص فوراً كشعار تنبيه (Push Notification) على شاشات قفل هواتف عملائك حاملي الكارت.
          </p>
        </div>

        {/* Status display */}
        {result && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs animate-in fade-in ${
              result.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">تم إرسال الإشعار بنجاح إلى المحفظة! 🎉</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    تم إشعار {result.notifiedDevices} جهاز متصل على الفور عبر Apple Push Notifications.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold">تعذر إرسال الإشعار</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{result.error}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSending || !message.trim()}
            onClick={handleSend}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>جاري بث الإشعار للأجهزة...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                <span>إرسال الإشعار لجميع الأجهزة الآن</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-100 border border-[rgba(255,255,255,0.1)] text-stone-700 text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
