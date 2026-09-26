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
  const svgDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
    customerLiveUrl
  )}&margin=2&format=svg`;

  const pngDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
    customerLiveUrl
  )}&margin=2&format=png`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
              <QrCode className="w-5 h-5 text-[#DD0200]" />
              <span>أكواد وتصاميم ستاندات الطاولات (Table QR &amp; Coasters)</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-md bg-[#55100D]/70 text-[#FBF9F5] border border-[#DD0200]/40 font-mono text-[10px] font-bold">
              300 DPI VECTOR
            </span>
          </div>
          <p className="text-xs text-[#A19E9B] mt-1 font-sans">
            ملفات طباعة مجهزة بأبعاد دقيقة للطابعات وشركات الدعاية والإعلان بدون تشويش.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={svgDownloadUrl}
            download={`memories-qr-${settings.cafeSlug}.svg`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل فيكتور للطباعة (SVG)</span>
          </a>

          <a
            href={pngDownloadUrl}
            download={`memories-qr-${settings.cafeSlug}.png`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#A19E9B]" />
            <span>تحميل صورة عالية الدقة (PNG)</span>
          </a>

          <button
            type="button"
            onClick={onOpenQuickSetup}
            className="px-4 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#DD0200]" />
            <span>معاينة ستاند الأكريليك</span>
          </button>
        </div>
      </div>

      {/* Visual Coaster / Table Tent Preview Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="w-full flex justify-center">
              <CoBrandingLogos
                cafeName={settings.branding?.name || 'Memories Studio'}
                cafeLogoUrl={settings.branding?.logoUrl}
                size="md"
                showTagline={false}
                theme="dark"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#FBF9F5] font-serif">
                وثّق لحظاتك واحصل على هديتك الترحيبية
              </h4>
              <p className="text-xs text-[#A19E9B]">
                امسح الكود بكاميرا هاتفك للبدء فوراً بدون تحميل أي تطبيق
              </p>
            </div>

            <div className="w-48 h-48 bg-white p-3 rounded-xl border border-white/20 mx-auto flex items-center justify-center shadow-lg">
              <RealOutsourcedQr
                value={customerLiveUrl}
                size={168}
                alt={`كود طاولة ${settings.branding?.name}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="pt-2 text-[11px] font-mono text-[#A19E9B] border-t border-white/10 flex items-center justify-between">
              <span>SCAN WITH CAMERA</span>
              <span>300 DPI TABLE STAND</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-3">
            <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Sparkles className="w-4 h-4 text-[#DD0200]" />
              <span>إرشادات طباعة ستاندات الطاولات لضمان أفضل تفاعل:</span>
            </h4>
            <ul className="text-xs text-[#A19E9B] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-[#55100D] border border-[#DD0200]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span><strong className="text-[#FBF9F5]">المقاس الموصى به:</strong> ستاند أكريليك عمودي مقاس 10×15 سم (A6) أو كوستر خشبي 9×9 سم.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-[#55100D] border border-[#DD0200]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span><strong className="text-[#FBF9F5]">جودة الفيكتور:</strong> استخدم ملف الـ SVG المرفق عند إرسال التصميم للمطبعة لضمان دقة لا متناهية عند المسح.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-[#55100D] border border-[#DD0200]/30 text-[#FBF9F5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span><strong className="text-[#FBF9F5]">موقع التثبيت:</strong> ثبّت ستاند واحد على كل طاولة، كاونتر استقبال، أو نقطة دفع لتحقيق معدل مسح يتجاوز 65% من رواد الكافيه.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0A0A] border border-white/10 text-xs font-mono text-[#A19E9B] flex items-center justify-between">
            <span>الرابط المشفر في الـ QR:</span>
            <span className="font-bold text-[#DD0200] truncate max-w-xs">{customerLiveUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
