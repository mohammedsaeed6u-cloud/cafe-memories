'use client';

import React from 'react';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { WALLET_BROADCAST_TEMPLATES } from '@/lib/constants/wallet-notification-presets';

interface WalletBroadcastModalProps {
  broadcastMsg: string;
  setBroadcastMsg: (msg: string) => void;
  isSendingBroadcast: boolean;
  broadcastResult: { success: boolean; message: string } | null;
  onBroadcast: () => void;
  brandName: string;
}

export function WalletBroadcastModal({
  broadcastMsg,
  setBroadcastMsg,
  isSendingBroadcast,
  broadcastResult,
  onBroadcast,
  brandName,
}: WalletBroadcastModalProps) {
  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-xs space-y-6">
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.1)]/60 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[#c92a54]" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#FBF9F5]">
            📢 بث إشعار فوري لكافة حاملي الكارت (Push Notification to Apple & Google Wallets)
          </h3>
          <p className="text-xs text-stone-400">
            أرسل عروض حية، تذكيرات، أو إعلان مشروب جديد يظهر مباشرة على شاشة قفل كل الزبائن عبر Apple Push Notification service (APNs)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-[#FBF9F5]">
          اختر قالباً سريعاً أو اكتب رسالتك المخصصة:
        </label>
        <div className="flex flex-wrap gap-2">
          {WALLET_BROADCAST_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setBroadcastMsg(tmpl)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                broadcastMsg === tmpl
                  ? 'bg-[#c92a54] text-white border-[#c92a54]'
                  : 'bg-white/5 hover:bg-white/10 text-stone-200 border-white/10'
              }`}
            >
              {tmpl.length > 40 ? tmpl.slice(0, 40) + '...' : tmpl}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            rows={3}
            maxLength={180}
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            className="w-full p-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-xs font-bold text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
            placeholder="اكتب الإشعار هنا..."
          />
          <span className="absolute left-3 bottom-3 text-[10px] font-mono text-stone-400">
            {broadcastMsg.length}/180
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-stone-400">
            💡 سيتم تحديث الكروت وإضاءة هواتف العملاء فوراً بدون الحاجة لأي تطبيق مثبت.
          </p>

          <button
            type="button"
            disabled={isSendingBroadcast || !broadcastMsg.trim()}
            onClick={onBroadcast}
            className="px-6 py-2.5 rounded-xl bg-[#c92a54] hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isSendingBroadcast ? 'animate-bounce' : ''}`} />
            <span>{isSendingBroadcast ? 'جاري البث للأجهزة...' : 'بث الإشعار الآن لكل المحافظ 🚀'}</span>
          </button>
        </div>

        {broadcastResult && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
              broadcastResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {broadcastResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{broadcastResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
