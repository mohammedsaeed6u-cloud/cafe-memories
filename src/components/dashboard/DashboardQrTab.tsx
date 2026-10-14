'use client';

import React from 'react';
import {
  QrCode,
  Download,
  Printer,
  Sparkles,
  Settings,
  Coffee,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

interface DashboardQrTabProps {
  settings: BusinessSettings;
  customerLiveUrl: string;
  onOpenQuickSetup: () => void;
}

export const DashboardQrTab: React.FC<DashboardQrTabProps> = ({
  settings,
  customerLiveUrl,
  onOpenQuickSetup,
}) => {
  const brandName = settings.branding?.name || 'مقهى ومحمصة ولاء';
  const cafeSlug = settings.cafeSlug || 'stampy';

  const svgDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
    customerLiveUrl
  )}&margin=2&format=svg`;

  const pngDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
    customerLiveUrl
  )}&margin=2&format=png`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-br from-[#c92a54] to-[#98183c] text-white shadow-md border border-white/10">
              <QrCode className="w-5 h-5 text-white" />
            </span>
            <span className="text-xs font-bold text-[#FBF9F5] bg-[#98183c]/60 px-2.5 py-1 rounded-md border border-[#c92a54]/40 font-mono">
              300 DPI VECTOR READY • أصول الطباعة الرسمية
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#FBF9F5] font-serif">
            أكواد وتصاميم ستاندات الطاولات والكاونتر
          </h2>
          <p className="text-xs text-[#A19E9B] mt-1 max-w-xl">
            ملفات متجهة وفكتور بدقة استثنائية جاهزة للإرسال المباشر للمطابع وشركات الدعاية والإعلان لإنتاج ستاندات الأكريليك.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={svgDownloadUrl}
            download={`stampy-qr-${cafeSlug}.svg`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-[#FBF9F5]" />
            <span>تحميل فيكتور (SVG)</span>
          </a>

          <a
            href={pngDownloadUrl}
            download={`stampy-qr-${cafeSlug}.png`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-[#A19E9B]" />
            <span>تحميل صورة عالية الدقة (PNG)</span>
          </a>

          <button
            type="button"
            onClick={onOpenQuickSetup}
            className="px-4 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#c92a54]" />
            <span>معاينة ستاند الأكريليك</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Table Tent Preview & Production Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="w-full flex justify-center">
              <CoBrandingLogos
                cafeName={brandName}
                cafeLogoUrl={settings.branding?.logoUrl}
                size="md"
                showTagline={false}
                theme="dark"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#FBF9F5] font-serif">
                وثّق لحظاتك واكسب هديتك الترحيبية
              </h4>
              <p className="text-xs text-[#A19E9B]">
                امسح الكود بكاميرا هاتفك لحفظ كارت الولاء في Apple & Google Wallet
              </p>
            </div>

            <div className="w-48 h-48 bg-white p-3 rounded-xl border border-white/20 mx-auto flex items-center justify-center shadow-lg">
              <RealOutsourcedQr
                value={customerLiveUrl}
                size={168}
                alt={`كود طاولة ${brandName}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="pt-2 text-[11px] font-mono text-[#A19E9B] border-t border-white/10 flex items-center justify-between">
              <span className="font-bold">SCAN WITH CAMERA</span>
              <span className="font-bold text-[#c92a54]">300 DPI TABLE STAND</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-4">
            <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 pb-3 border-b border-white/10 font-serif">
              <Sparkles className="w-4 h-4 text-[#c92a54]" />
              <span>إرشادات طباعة ستاندات الطاولات لضمان أفضل تفاعل للعملاء:</span>
            </h4>
            <ul className="text-xs text-[#A19E9B] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#98183c] border border-[#c92a54]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span><strong className="text-[#FBF9F5]">المقاس القياسي الموصى به:</strong> ستاند أكريليك شفاف عمودي مقاس 10×15 سم (A6) أو كوستر خشبي محفور 9×9 سم.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#98183c] border border-[#c92a54]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span><strong className="text-[#FBF9F5]">ملف الفيكتور المباشر:</strong> استخدم ملف SVG المرفق عند إرسال التصميم للمطبعة لضمان دقة متناهية لا تتأثر بالتكبير.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#98183c] border border-[#c92a54]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span><strong className="text-[#FBF9F5]">مواقع التثبيت الإستراتيجية:</strong> ستاند واحد على كل طاولة، وستاند على كاونتر الاستلام والطلب لتحقيق أعلى نسبة حفظ لكارت المحفظة.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0A0A] border border-white/10 text-xs font-mono text-[#A19E9B] flex items-center justify-between shadow-inner">
            <span className="text-[#A19E9B]/60">الرابط المشفر في الـ QR:</span>
            <span className="font-bold text-[#c92a54] truncate max-w-xs">{customerLiveUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
