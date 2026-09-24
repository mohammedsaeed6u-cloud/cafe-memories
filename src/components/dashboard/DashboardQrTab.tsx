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
      <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <span>أكواد وتصاميم ستاندات الطاولات (Table QR &amp; Coasters)</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[10px] font-bold">
              300 DPI VECTOR
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            ملفات طباعة مجهزة بأبعاد دقيقة للطابعات وشركات الدعاية والإعلان بدون تشويش.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={svgDownloadUrl}
            download={`memories-qr-${settings.cafeSlug}.svg`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل فيكتور للطباعة (SVG)</span>
          </a>

          <a
            href={pngDownloadUrl}
            download={`memories-qr-${settings.cafeSlug}.png`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>تحميل صورة عالية الدقة (PNG)</span>
          </a>

          <button
            type="button"
            onClick={onOpenQuickSetup}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>معاينة ستاند الأكريليك</span>
          </button>
        </div>
      </div>

      {/* Visual Coaster / Table Tent Preview Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm p-8 rounded-3xl bg-white border-2 border-stone-200 shadow-xl space-y-6 text-center relative overflow-hidden">
            <div className="w-full flex justify-center">
              <CoBrandingLogos
                cafeName={settings.branding?.name || 'Memories Studio'}
                cafeLogoUrl={settings.branding?.logoUrl}
                size="md"
                showTagline={false}
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-stone-950">
                وثّق لحظاتك واحصل على هديتك الترحيبية
              </h4>
              <p className="text-xs text-stone-500">
                امسح الكود بكاميرا هاتفك للبدء فوراً بدون تحميل أي تطبيق
              </p>
            </div>

            <div className="w-48 h-48 bg-stone-50 p-3 rounded-2xl border-2 border-dashed border-stone-300 mx-auto flex items-center justify-center shadow-inner">
              <RealOutsourcedQr
                value={customerLiveUrl}
                size={168}
                alt={`كود طاولة ${settings.branding?.name}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="pt-2 text-[11px] font-mono text-stone-400 border-t border-stone-100 flex items-center justify-between">
              <span>SCAN WITH CAMERA</span>
              <span>300 DPI TABLE STAND</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-stone-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>إرشادات طباعة ستاندات الطاولات لضمان أفضل تفاعل:</span>
            </h4>
            <ul className="text-xs text-stone-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span><strong>المقاس الموصى به:</strong> ستاند أكريليك عمودي مقاس 10×15 سم (A6) أو كوستر خشبي 9×9 سم.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span><strong>جودة الفيكتور:</strong> استخدم ملف الـ SVG المرفق عند إرسال التصميم للمطبعة لضمان دقة لا متناهية عند المسح.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span><strong>موقع التثبيت:</strong> ثبّت ستاند واحد على كل طاولة بجانب علبة المناديل أو المنيو لتحقيق معدل مسح يتجاوز 65% من رواد الكافيه.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs font-mono text-stone-700 flex items-center justify-between">
            <span>الرابط المشفر في الـ QR:</span>
            <span className="font-bold text-amber-900 truncate max-w-xs">{customerLiveUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
