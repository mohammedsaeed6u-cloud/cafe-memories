'use client';

import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Radio,
  Download,
  Sparkles,
  Layers,
  CheckCircle2,
  Copy,
  ExternalLink,
  Smartphone,
  Eye,
  Globe,
} from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { PrintService } from '@/lib/services/print.service';
import { BusinessSettings } from '@/types/photobooth';

export type StandeeMaterial = 'acrylic_black' | 'nordic_wood' | 'paper_tent';

export interface TablePreset {
  id: string;
  label: string;
  tableNum: string;
}

const DEFAULT_TABLES: TablePreset[] = [
  { id: 't-01', label: 'طاولة 01 (داخلي)', tableNum: '01' },
  { id: 't-02', label: 'طاولة 02 (داخلي)', tableNum: '02' },
  { id: 't-03', label: 'طاولة 03 (النافذة)', tableNum: '03' },
  { id: 't-04', label: 'طاولة 04 (تراس خارجي)', tableNum: '04' },
  { id: 't-05', label: 'طاولة 05 (تراس خارجي)', tableNum: '05' },
  { id: 'counter-main', label: 'كاونتر الاستلام الرئيسي', tableNum: 'Counter' },
  { id: 'vip-lounge', label: 'صالة كبار الزوار (VIP)', tableNum: 'VIP' },
];

interface Props {
  settings: BusinessSettings;
  cafeSlug: string;
}

export const TableStandeeStudio: React.FC<Props> = ({ settings, cafeSlug }) => {
  const [selectedTable, setSelectedTable] = useState<TablePreset>(DEFAULT_TABLES[0]);
  const [material, setMaterial] = useState<StandeeMaterial>('acrylic_black');
  const [customTableNum, setCustomTableNum] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const brandName = settings?.branding?.name || 'منشأة ستامبي';
  const effectiveTableNum = customTableNum.trim() || selectedTable.tableNum;
  
  // URL formats: Universal Direct Path vs Dedicated Platform Subdomain
  const [urlFormat, setUrlFormat] = useState<'universal' | 'subdomain'>('universal');
  const rootDomain = typeof window !== 'undefined' ? window.location.origin : 'https://memories-c9w.pages.dev';
  const cleanSlug = encodeURIComponent(cafeSlug.trim().toLowerCase());
  const encodedTable = encodeURIComponent(effectiveTableNum);

  const universalUrl = `${rootDomain}/c/${cleanSlug}?table=${encodedTable}&src=nfc_standee`;
  const subdomainUrl = `https://${cleanSlug}.stampy.sa?table=${encodedTable}&src=nfc_standee`;
  const destinationUrl = urlFormat === 'subdomain' ? subdomainUrl : universalUrl;

  const handlePrint = () => {
    PrintService.printTableStand('standee-print-target', {
      title: `${brandName} - Standee Table ${effectiveTableNum}`,
      cafeName: brandName,
    });
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(destinationUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#141212] border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>NFC &amp; QR Table Standee Studio • استوديو ستاندات الطاولات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#FBF9F5]">
            ستاندات الطاولات الفيزيائية وكروت الخيمة (A6 Ready)
          </h2>
          <p className="text-xs sm:text-sm text-[#A19E9B] max-w-xl">
            صمّم واطبع ستاندات أكريليك أو خشبية أو كروت خيمة ورقية لكل طاولة في منشأتك. العميل يقرب هاتفه بالـ NFC أو يمسح الكاميرا لفتح كارت الولاء واستوديو الصور فورياً.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-[#141212] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة فورية مقاس A6</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Controls & Material Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Material & Style Picker */}
          <div className="p-6 rounded-3xl bg-[#141212] border border-white/10 shadow-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#FBF9F5] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>خامة وتصميم الستاند (Material &amp; Style)</span>
            </h3>

            <div className="space-y-3">
              {/* Option 1: Matte Black Luxury Acrylic */}
              <button
                type="button"
                onClick={() => setMaterial('acrylic_black')}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                  material === 'acrylic_black'
                    ? 'bg-[#1C1A1A] border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-[#0E0D0D] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-amber-400" />
                    <span>أكريليك أسود فاخر (Matte Black Acrylic)</span>
                  </div>
                  <p className="text-[11px] text-[#A19E9B] mt-1 leading-relaxed">
                    لوح أسود غير لامع مع طباعة ذهبية وشعار NFC المعدني. مخصص للمنشآت الراقية، المطاعم، والبوتيك.
                  </p>
                </div>
                {material === 'acrylic_black' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>

              {/* Option 2: Nordic Natural Oak Wood */}
              <button
                type="button"
                onClick={() => setMaterial('nordic_wood')}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                  material === 'nordic_wood'
                    ? 'bg-[#1C1A1A] border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-[#0E0D0D] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C29B38]" />
                    <span>خشب البلوط الطبيعي (Nordic Oak Wood)</span>
                  </div>
                  <p className="text-[11px] text-[#A19E9B] mt-1 leading-relaxed">
                    مظهر خشبي عضوي دافئ مع حفر ليزر غامق. مثالي للمقاهي المتخصصة، المخابز، والمحامص.
                  </p>
                </div>
                {material === 'nordic_wood' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>

              {/* Option 3: Foldable A6 Paper Tent Card */}
              <button
                type="button"
                onClick={() => setMaterial('paper_tent')}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                  material === 'paper_tent'
                    ? 'bg-[#1C1A1A] border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-[#0E0D0D] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-200 border border-stone-400" />
                    <span>كارت خيمة ورقي قابل للطي (A6 Tent Card)</span>
                  </div>
                  <p className="text-[11px] text-[#A19E9B] mt-1 leading-relaxed">
                    جاهز للطباعة على أي طابعة مكتبية أو ورق مقوى مع علامات الطي في المنتصف.
                  </p>
                </div>
                {material === 'paper_tent' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Table Number & Routing Presets */}
          <div className="p-6 rounded-3xl bg-[#141212] border border-white/10 shadow-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#FBF9F5] uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>تحديد الطاولة ونقطة الحضور (Table Attribution)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_TABLES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTable(t);
                    setCustomTableNum('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    selectedTable.id === t.id && !customTableNum
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-[#1C1A1A] text-[#FBF9F5] hover:bg-[#282626] border border-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-[11px] text-[#A19E9B] block mb-1">أو اكتب اسم / رقم طاولة مخصص:</label>
              <input
                type="text"
                value={customTableNum}
                onChange={(e) => setCustomTableNum(e.target.value)}
                placeholder="مثلاً: طاولة 15، البار الخارجي، كابينة 4"
                className="w-full text-sm font-bold py-2.5 px-3 rounded-xl bg-[#0E0D0D] border border-white/10 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Destination URL & Direct Copy */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#A19E9B] font-bold">تنسيق الرابط في الـ QR / NFC:</span>
                <div className="flex items-center gap-1 bg-[#0E0D0D] p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setUrlFormat('universal')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                      urlFormat === 'universal' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-[#A19E9B] hover:text-white'
                    }`}
                  >
                    رابط عام (Cloudflare)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlFormat('subdomain')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                      urlFormat === 'subdomain' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-[#A19E9B] hover:text-white'
                    }`}
                  >
                    Subdomain مخصص
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-400/80 text-[10px] font-mono">
                  {urlFormat === 'subdomain' ? '✦ مشفّر بنطاق الـ Subdomain المباشر' : '✦ مشفّر بمسار Cloudflare العالمي'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080707] border border-white/5 text-[11px] font-mono text-[#FBF9F5]/80 truncate dir-ltr text-left">
                {destinationUrl}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time 3D Print Standee Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between px-2 text-xs font-mono text-[#A19E9B]">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>معاينة ستاند مقاس A6 (105×148 ملم)</span>
            </span>
            <span className="bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
              طاولة: {effectiveTableNum}
            </span>
          </div>

          {/* PHYSICAL STANDEE RENDER CANVAS */}
          <div
            id="standee-print-target"
            className={`w-full max-w-[340px] aspect-[105/148] rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ${
              material === 'acrylic_black'
                ? 'bg-gradient-to-b from-[#181616] via-[#111010] to-[#0A0909] border-2 border-amber-500/40 text-amber-100 ring-1 ring-amber-400/20'
                : material === 'nordic_wood'
                ? 'bg-[#EAE1D3] border-2 border-[#8C6D46] text-[#2B1B10] shadow-[inset_0_0_40px_rgba(140,109,70,0.15)]'
                : 'bg-[#FAF8F5] border-2 border-stone-800 text-stone-900'
            }`}
          >
            {/* Top Brand Header & NFC Indicator */}
            <div className="w-full flex flex-col items-center space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                    material === 'acrylic_black'
                      ? 'bg-amber-500 text-black shadow-md'
                      : material === 'nordic_wood'
                      ? 'bg-[#5C3F24] text-[#EAE1D3]'
                      : 'bg-black text-white'
                  }`}
                >
                  {brandName.charAt(0)}
                </div>
                <h3 className="font-black text-base tracking-wide font-sans">{brandName}</h3>
              </div>

              {/* Contactless Wave Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase ${
                  material === 'acrylic_black'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : material === 'nordic_wood'
                    ? 'bg-[#5C3F24]/10 text-[#5C3F24] border border-[#5C3F24]/30'
                    : 'bg-stone-100 text-stone-700 border border-stone-300'
                }`}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                <span>TAP NFC OR SCAN QR</span>
              </div>
            </div>

            {/* High-Contrast Luxury QR Code Vitrine */}
            <div
              className={`p-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-md ${
                material === 'acrylic_black'
                  ? 'bg-white border-2 border-amber-400/50'
                  : material === 'nordic_wood'
                  ? 'bg-white border-2 border-[#8C6D46]'
                  : 'bg-white border-2 border-stone-900'
              }`}
            >
              <RealOutsourcedQr
                value={destinationUrl}
                size={140}
                alt="Table Standee QR"
                className="w-34 h-34 object-contain"
              />
              <span className="text-[9px] font-mono font-black text-stone-900 tracking-wider">
                TABLE • {effectiveTableNum}
              </span>
            </div>

            {/* Dual CTA Callout */}
            <div className="space-y-1 pb-1">
              <div className="text-xs font-black leading-snug">
                قَرّب هاتفك من الستاند أو امسح الكاميرا
              </div>
              <p
                className={`text-[10px] font-medium leading-tight max-w-[240px] mx-auto ${
                  material === 'acrylic_black'
                    ? 'text-amber-200/70'
                    : material === 'nordic_wood'
                    ? 'text-[#5C3F24]/80'
                    : 'text-stone-600'
                }`}
              >
                التقط شريط صور 4-Cuts مجاني واكسب أختام الولاء في Apple Wallet
              </p>
            </div>

            {/* Bottom Footer Attribution */}
            <div
              className={`w-full pt-2 border-t flex items-center justify-between text-[9px] font-mono font-bold ${
                material === 'acrylic_black'
                  ? 'border-white/10 text-amber-400/60'
                  : material === 'nordic_wood'
                  ? 'border-[#8C6D46]/20 text-[#5C3F24]/60'
                  : 'border-stone-300 text-stone-500'
              }`}
            >
              <span>{settings?.locationConfig?.relevantText || 'Flagship Branch'}</span>
              <span>NO APP REQUIRED</span>
            </div>
          </div>

          {/* Quick Print Banner */}
          <div className="w-full max-w-[340px] flex items-center justify-between p-3 rounded-2xl bg-[#141212] border border-white/10 text-xs">
            <span className="text-[#A19E9B] text-[11px]">جاهز للإرسال إلى الطابعة:</span>
            <button
              type="button"
              onClick={handlePrint}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الستاند الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
