'use client';

import React, { useCallback, useState } from 'react';
import { QrCode, Download, Printer, Sparkles, Store, CheckCircle } from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

interface DashboardQrTabProps {
  settings: BusinessSettings;
  customerLiveUrl: string;
}

export const DashboardQrTab: React.FC<DashboardQrTabProps> = ({
  settings,
  customerLiveUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDataUrl = useCallback((dataUrl: string) => {
    setQrDataUrl(dataUrl);
  }, []);

  const download = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `stampy-qr-${settings.cafeSlug || 'venue'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(customerLiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
              <QrCode className="h-5 w-5 text-[#DFAB56]" />
              <span>رموز الطاولات والكاونتر</span>
            </h3>
            <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/70 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#FAF5EB]">
              LIVE QR
            </span>
          </div>
          <p className="mt-1 max-w-xl text-xs text-[#A19E9B]">
            رمز واحد لكل طاولة وكاونتر. يُنشأ داخل المتصفح مباشرة، ولا يعتمد على أي خدمة خارجية.
            اطبع الستاند بحجم A6 وثبّته على كل طاولة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={download}
            disabled={!qrDataUrl}
            className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E] transition hover:bg-[#C99645] disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>تحميل رمز QR</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-4 py-2 text-xs font-bold text-[#FAF5EB] transition hover:bg-[#211F1F]"
          >
            <Printer className="h-4 w-4 text-[#DFAB56]" />
            <span>طباعة الستاند</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex justify-center lg:col-span-6">
          <div className="w-full max-w-sm space-y-6 overflow-hidden rounded-2xl border border-white/10 bg-[#141212] p-8 text-center shadow-2xl">
            <div className="flex w-full justify-center">
              <CoBrandingLogos
                cafeName={settings.branding?.name || 'stampy.'}
                cafeLogoUrl={settings.branding?.logoUrl}
                size="md"
                showTagline={false}
                theme="dark"
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-[#FAF5EB]">
                وثّق لحظاتك واحصل على هديتك
              </h4>
              <p className="text-xs text-[#A19E9B]">
                امسح الكود بكاميرا هاتفك للبدء فوراً بدون تحميل أي تطبيق
              </p>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl border border-white/20 bg-white p-3 shadow-lg">
              <RealOutsourcedQr
                value={customerLiveUrl}
                size={168}
                alt={`كود طاولة ${settings.branding?.name}`}
                className="h-full w-full object-contain"
                onDataUrlReady={handleDataUrl}
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px] text-[#A19E9B]">
              <span>SCAN WITH CAMERA</span>
              <span>A6 TABLE STAND</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-6">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
            <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-[#FAF5EB]">
              <Sparkles className="h-4 w-4 text-[#DFAB56]" />
              <span>إرشادات الطباعة</span>
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed text-[#A19E9B]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#DFAB56]/30 bg-[#3D2314] text-[10px] font-bold text-[#FAF5EB]">
                  1
                </span>
                <span>
                  <strong className="text-[#FAF5EB]">المقاس:</strong> ستاند أكريليك عمودي 10×15 سم
                  (A6) أو كوستر 9×9 سم.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#DFAB56]/30 bg-[#3D2314] text-[10px] font-bold text-[#FAF5EB]">
                  2
                </span>
                <span>
                  <strong className="text-[#FAF5EB]">الرابط:</strong> يفتح تجربة الزائر الخاصة
                  بمنشأتك مباشرة، وكل مسح يُحتسب في تقارير المنشأة.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#DFAB56]/30 bg-[#3D2314] text-[10px] font-bold text-[#FAF5EB]">
                  3
                </span>
                <span>
                  <strong className="text-[#FAF5EB]">الموقع:</strong> ستاند على كل طاولة، الكاونتر،
                  ونقطة الدفع.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#0B0A0A] p-4 text-xs text-[#A19E9B] sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-[#DFAB56]" />
              رابط الزائر
            </span>
            <span className="max-w-xs truncate font-mono font-bold text-[#DFAB56]" dir="ltr">
              {customerLiveUrl}
            </span>
          </div>

          <button
            type="button"
            onClick={copyUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1C1B1B] px-4 py-2.5 text-xs font-bold text-[#FAF5EB] transition hover:bg-[#211F1F]"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <QrCode className="h-4 w-4 text-[#A19E9B]" />
            )}
            {copied ? 'تم نسخ الرابط' : 'نسخ رابط الزائر'}
          </button>
        </div>
      </div>
    </div>
  );
};
