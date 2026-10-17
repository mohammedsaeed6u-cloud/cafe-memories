'use client';

import React from 'react';
import { MapPin, Smartphone, Compass } from 'lucide-react';
import { LOCKSCREEN_MESSAGE_PRESETS } from '@/lib/constants/wallet-notification-presets';

interface WalletGeofenceSectionProps {
  geofenceEnabled: boolean;
  onToggleGeofence: (val: boolean) => void;
  latitude: number;
  onLatitudeChange: (val: number) => void;
  longitude: number;
  onLongitudeChange: (val: number) => void;
  altitude?: number;
  onAltitudeChange: (val?: number) => void;
  relevantText: string;
  onRelevantTextChange: (val: string) => void;
  isDetectingGps: boolean;
  gpsNotice: string | null;
  onDetectGps: () => void;
  brandName: string;
}

export function WalletGeofenceSection({
  geofenceEnabled,
  onToggleGeofence,
  latitude,
  onLatitudeChange,
  longitude,
  onLongitudeChange,
  altitude,
  onAltitudeChange,
  relevantText,
  onRelevantTextChange,
  isDetectingGps,
  gpsNotice,
  onDetectGps,
  brandName,
}: WalletGeofenceSectionProps) {
  return (
    <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#98183c]/50 text-[#c92a54] border border-[#c92a54]/40 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#c92a54]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <span>📍 إحداثيات الفرع والظهور التلقائي على شاشة القفل (~100 متر)</span>
            </h3>
            <p className="text-xs text-[#A19E9B]">
              تقنية Apple Wallet & Google Wallet Location Relevance Protocol
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto">
          <span className="text-xs font-bold text-[#FBF9F5]">
            {geofenceEnabled ? 'الخاصية مفعلة' : 'معطلة'}
          </span>
          <input
            type="checkbox"
            checked={geofenceEnabled}
            onChange={(e) => onToggleGeofence(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-12 h-6 rounded-full transition-colors relative ${
              geofenceEnabled ? 'bg-[#c92a54]' : 'bg-[#1C1B1B] border border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                geofenceEnabled ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          </div>
        </label>
      </div>

      <div className="p-4 rounded-xl bg-[#98183c]/30 border border-[#c92a54]/40 text-[#FBF9F5] text-xs leading-relaxed space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-[#FBF9F5]">
          <Smartphone className="w-4 h-4 text-[#c92a54]" />
          <span>كيف تعمل هذه التقنية في هواتف الزبائن؟</span>
        </p>
        <p className="text-[#A19E9B]">
          عند قيام الزبون بحفظ كارت الولاء في Apple Wallet، يتعرف معالج الآيفون تلقائياً على وصوله على بعد <strong>100 متر</strong> تقريباً من إحداثيات فرعك، فيقوم بإضاءة شاشة القفل تلقائياً وإبراز الكارت مع رسالتك الترحيبية، ليتمكن من إظهاره للكاشير والختم بلمسة واحدة بدون فتح التطبيقات!
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isDetectingGps}
            onClick={onDetectGps}
            className="px-4 py-2.5 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
            <span>{isDetectingGps ? 'جاري تحديد موقعك عبر الأقمار...' : '📍 تحديد إحداثيات فرعي الحالي الآن (GPS)'}</span>
          </button>
          {gpsNotice && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40 animate-in fade-in">
              {gpsNotice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
              خط العرض (Latitude)
            </label>
            <input
              type="number"
              step="0.000001"
              dir="ltr"
              value={latitude}
              onChange={(e) => onLatitudeChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] font-mono focus:border-[#c92a54] focus:ring-1 focus:ring-[#c92a54]/30 focus:outline-none"
              placeholder="30.0444"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
              خط الطول (Longitude)
            </label>
            <input
              type="number"
              step="0.000001"
              dir="ltr"
              value={longitude}
              onChange={(e) => onLongitudeChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] font-mono focus:border-[#c92a54] focus:ring-1 focus:ring-[#c92a54]/30 focus:outline-none"
              placeholder="31.2357"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
              الارتفاع بالمتر (اختياري)
            </label>
            <input
              type="number"
              step="1"
              dir="ltr"
              value={altitude ?? ''}
              onChange={(e) => onAltitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] font-mono focus:border-[#c92a54] focus:ring-1 focus:ring-[#c92a54]/30 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-[#FBF9F5]">
            نص الترحيب الذي يظهر على شاشة قفل الزبون (Lock-screen Text):
          </label>
          <input
            type="text"
            maxLength={128}
            value={relevantText}
            onChange={(e) => onRelevantTextChange(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:border-[#c92a54] focus:ring-1 focus:ring-[#c92a54]/30 focus:outline-none font-bold"
            placeholder={`أهلاً بك في ${brandName}! كارت الولاء جاهز للختم ✨`}
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[10px] text-[#A19E9B] font-bold self-center">قوالب سريعة:</span>
            {LOCKSCREEN_MESSAGE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onRelevantTextChange(preset.replace('{cafeName}', brandName))}
                className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10 transition cursor-pointer"
              >
                {preset.replace('{cafeName}', brandName)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
