'use client';

import React from 'react';
import { Bell, RefreshCw, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { NOTIFICATION_TEMPLATES, UseDashboardSettingsReturn } from '../types';

interface Props {
  vm: UseDashboardSettingsReturn;
}

export const SettingsBroadcastSection: React.FC<Props> = ({ vm }) => {
  const {
    connectedPassesCount,
    notifResult,
    notificationMsg,
    setNotificationMsg,
    isSendingNotif,
    handleBroadcastNotification,
  } = vm;

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-[rgba(255,255,255,0.1)] shadow-sm space-y-4">
      <div className="pb-3 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-800" />
          <div>
            <h4 className="font-bold text-sm text-[#FBF9F5]" style={{ fontFamily: 'var(--font-jakarta), var(--font-cairo), sans-serif' }}>
              5. مركز بث إشعارات المحفظة الرقمية (Wallet Push Broadcast Center)
            </h4>
            <p className="text-xs text-stone-500">
              بث إشعارات حية لشاشات قفل هواتف عملائك الحاملين لكروت Apple Wallet & Google Wallet.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>{connectedPassesCount} بطاقة متصلة بالهواتف</span>
        </span>
      </div>

      {notifResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
            notifResult.success
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          {notifResult.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notifResult.message}</span>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-700">
          قوالب إشعارات سريعة مقترحة:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NOTIFICATION_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNotificationMsg(tmpl)}
              className={`p-3 rounded-xl border text-right text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                notificationMsg === tmpl
                  ? 'border-amber-800 bg-amber-50 font-bold text-[#FBF9F5]'
                  : 'border-[rgba(255,255,255,0.1)] bg-[#141212] hover:bg-[#0B0A0A] text-stone-600'
              }`}
            >
              <span className="line-clamp-1">{tmpl}</span>
              <span className="text-[10px] text-amber-800 font-bold shrink-0">اختيار</span>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            نص الإشعار المرسل لشاشات القفل:
          </label>
          <textarea
            rows={3}
            value={notificationMsg}
            onChange={(e) => setNotificationMsg(e.target.value)}
            placeholder="اكتب رسالة الإشعار الترحيبي أو العرض الخاص لعملائك هنا..."
            className="w-full p-3.5 text-xs rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#141212] focus:outline-none focus:border-[#c92a54] text-[#FBF9F5] leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
            <span>يظهر الإشعار فوراً كإشعار Apple Pay / Wallet على قفل الشاشة</span>
            <span className="font-mono">{notificationMsg.length} حرف</span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            disabled={isSendingNotif || !notificationMsg.trim()}
            onClick={handleBroadcastNotification}
            className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
          >
            {isSendingNotif ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري بث الإشعار عبر APNs...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>بث الإشعار لجميع الأجهزة الآن 📢</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
