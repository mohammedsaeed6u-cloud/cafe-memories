const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update src/app/layout.tsx
const layoutPath = path.join(rootDir, 'src/app/layout.tsx');
let layoutCode = fs.readFileSync(layoutPath, 'utf-8');
layoutCode = layoutCode.replace(/themeColor:\s*'#141313'/g, "themeColor: '#12100E'");
layoutCode = layoutCode.replace(
  /title:\s*'memories • [^']+'/g,
  "title: 'استامبي (Stampy) • منصة كروت التصوير التفاعلية وبرامج الولاء الذكية'"
);
layoutCode = layoutCode.replace(
  /siteName:\s*'memories'/g,
  "siteName: 'Stampy استامبي'"
);
layoutCode = layoutCode.replace(
  /title:\s*'Memories'/g,
  "title: 'Stampy استامبي'"
);
layoutCode = layoutCode.replace(
  /description:\s*'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم[^']+'/g,
  "description: 'تحويل كل زيارة في منشأتك إلى شريط ذكريات يدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوتوبوث تفاعلي عبر الهاتف، شاشات صالة حية، وأختام ولاء رقمية لمحفظة Apple و Google Wallet.'"
);
fs.writeFileSync(layoutPath, layoutCode, 'utf-8');
console.log('✓ layout.tsx updated with Stampy metadata');

// 2. Rewrite src/features/marketing/components/MarketingHeader.tsx
const headerCode = `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { Search, ArrowRight, UserCheck, Menu, X, Tv, ShieldCheck, Sparkles, Store } from 'lucide-react';

interface MarketingHeaderProps {
  onOpenSearch?: () => void;
}

export function MarketingHeader({ onOpenSearch }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '#customer-journey', label: 'رحلة العميل' },
    { href: '#business-operation', label: 'تشغيل المنشأة' },
    { href: '#live-wall', label: 'شاشة الصالة' },
    { href: '#pricing', label: 'باقات الشراكة' },
    { href: '#trust', label: 'المعمارية والأمان' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#12100E]/90 backdrop-blur-2xl border-b border-[#DFAB56]/15 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Official Stampy Brand Logo */}
        <Link href="/" className="flex items-center group">
          <StampyLogo size="md" showTagline={true} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#DFAB56] transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-stone-300 hover:text-white hover:border-[#DFAB56]/30 text-xs transition-colors"
              title="بحث في المنظومة (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#DFAB56]" />
              <span className="text-[11px] font-mono text-stone-400">⌘K</span>
            </button>
          )}

          <Link
            href="/c/stampy"
            className="hidden sm:inline-flex items-center gap-2 text-xs py-2 px-3.5 rounded-lg bg-[#3D2314] hover:bg-[#4D2E1A] text-[#DFAB56] border border-[#DFAB56]/30 font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span>تجربة الاستوديو</span>
          </Link>

          <Link
            href="/login"
            className="text-xs py-2 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold shadow-md shadow-amber-950/20 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>لوحة التحكم</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[#DFAB56]/20 bg-[#12100E]/95 backdrop-blur-2xl px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-stone-300 hover:text-[#DFAB56] py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/c/stampy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#3D2314] text-[#DFAB56] text-xs font-semibold border border-[#DFAB56]/30"
            >
              فتح استوديو الزائر
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#DFAB56] text-[#12100E] text-xs font-bold"
            >
              دخول لوحة تحكم المنشأة
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
`;
fs.writeFileSync(path.join(rootDir, 'src/features/marketing/components/MarketingHeader.tsx'), headerCode, 'utf-8');
console.log('✓ MarketingHeader.tsx updated with Stampy brand');

// 3. Rewrite src/features/marketing/components/MarketingHero.tsx
const heroCode = `'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Camera, ShieldCheck, Zap } from 'lucide-react';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';
import { StampyHeroTicket } from '@/components/brand/StampyLogo';

export function MarketingHero() {
  return (
    <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-20 max-w-5xl mx-auto text-center font-sans">
      {/* Category Pill with Stampy Ochre & 5 Spectral Stripes */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#DFAB56]/30 bg-[#DFAB56]/10 text-stone-200 text-xs font-mono font-bold mb-8 backdrop-blur-xl shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-pulse" />
        <span className="tracking-[0.15em] uppercase text-[#DFAB56]">
          STAMPY • استامبي • منصة كروت التصوير والولاء الذكية
        </span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.15]">
          كل زيارة تصنع أثراً يدوم.<br />
          <span className="bg-gradient-to-r from-[#DFAB56] via-[#EBA935] to-[#FAF5EB] bg-clip-text text-transparent">
            استوديو الذكريات والولاء الفاخر لمنشأتك.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-normal">
          كروت تصوير فوتوبوث زجاجية تفاعلية، بطاقات ولاء رقمية في Apple Wallet و Google Wallet، وشاشات صالة حية تعيد الرواد لمنشأتك دون تطبيقات أو تعقيد.
        </p>
      </div>

      {/* Hero CTAs */}
      <div className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/c/stampy"
          className="w-full sm:w-auto text-xs py-3.5 px-7 rounded-xl bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-extrabold shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#12100E]" />
          <span>فتح استوديو التصوير المباشر</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </Link>

        <Link
          href="/login"
          className="w-full sm:w-auto text-xs py-3.5 px-7 rounded-xl bg-[#1E1B18] hover:bg-[#2A2622] border border-[#DFAB56]/30 hover:border-[#DFAB56] text-[#FAF5EB] font-bold backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>لوحة تحكم المنشأة</span>
        </Link>
      </div>

      {/* Centerpiece: Official Tilted Stampy Ticket (-6.42°) */}
      <div className="my-8 flex justify-center">
        <StampyHeroTicket size={340} />
      </div>

      {/* Centerpiece: Interactive Photobooth Strip Showcase */}
      <div className="mt-12">
        <AppleLuxuryShowcase />
      </div>
    </section>
  );
}
`;
fs.writeFileSync(path.join(rootDir, 'src/features/marketing/components/MarketingHero.tsx'), heroCode, 'utf-8');
console.log('✓ MarketingHero.tsx updated with Stampy brand & Hero Ticket');

// 4. Rewrite src/features/marketing/components/MarketingTrustSection.tsx
const trustCode = `'use client';

import React from 'react';
import { ShieldCheck, Lock, Cpu, Database, RefreshCw, Zap, Server, Activity, AlertTriangle, Key } from 'lucide-react';

export function MarketingTrustSection() {
  const architecturalPillars = [
    {
      num: '01',
      title: 'منع تضارب الطلبات (Race Conditions Guard)',
      desc: 'قفل ذري متزامن (Mutex) مع إصدارات تدقيق متفائلة تمنع استبدال القسائم أو الأختام المزدوجة نهائياً.',
      icon: Cpu,
    },
    {
      num: '02',
      title: 'القضاء على استعلامات N+1 (Batch Data Aggregator)',
      desc: 'تجميع استعلامات CRM وسجلات العملاء والأختام بدفعة معالجة واحدة (Batch Loader) لتحقيق استجابة تحت 10ms.',
      icon: Database,
    },
    {
      num: '03',
      title: 'تتبع الأخطاء الصفرية (Zero Silent Failures)',
      desc: 'تسجيل تحليلي موحد مع معرفات ارتباط فريدة (Correlation IDs) وتتبع المسار وسياق التشغيل كاملاً.',
      icon: Activity,
    },
    {
      num: '04',
      title: 'محددات السرعة المنزلقة (Sliding-Window Rate Limits)',
      desc: 'حماية رمز PIN من التخمين (قفل فوري بعد 5 محاولات) وتقييد طلبات الأختام ورفع الصور تلقائياً.',
      icon: Lock,
    },
    {
      num: '05',
      title: 'طابور المهام غير المتزامن (Async Background Jobs)',
      desc: 'معالجة دمج الشرائط عالية الدقة 4K وطباعة الكروت في الخلفية دون تجميد مسار الـ HTTP مع طابور DLQ.',
      icon: Zap,
    },
    {
      num: '06',
      title: 'تنبيهات الحصص والاستهلاك (Spend Alerts & Quotas)',
      desc: 'مراقبة سعة التخزين والزيارات وطابور الطباعة لكل منشأة مع تنبيهات استباقية عند 80% وإغلاق وقائي.',
      icon: AlertTriangle,
    },
    {
      num: '07',
      title: 'التراجع الفوري بدون توقف (Zero-Downtime Rollback)',
      desc: 'فحص تكاملي فوري للصحة (/api/health) وتثبيت النشر السحابي مع إمكانية الرجوع الفوري لأي إصدار.',
      icon: RefreshCw,
    },
    {
      num: '08',
      title: 'صمود المزامنة دون اتصال (Offline-First Resilience)',
      desc: 'محطة الكاشير وشاشة الصالة تعملان بثبات أثناء انقطاع الإنترنت المؤقت وتتزامنان تلقائياً عند العودة.',
      icon: Server,
    },
    {
      num: '09',
      title: 'أمان الـ Webhooks ومنع التكرار (HMAC & Idempotency)',
      desc: 'تشفير الإشعارات بتوقيع HMAC-SHA256 مع سجل مفاتيح منع التكرار لضمان معالجة الحدث مرة واحدة تماماً.',
      icon: Key,
    },
    {
      num: '10',
      title: 'النسخ الاحتياطي والتعافي التلقائي (Disaster Recovery)',
      desc: 'تصدير لقطة بيانات شاملة مشفرة لكل منشأة مع رمز تحقق للسلامة (SHA Checksum) لاختبار الاستعادة.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="trust" className="py-24 px-6 max-w-6xl mx-auto border-t border-[#DFAB56]/15">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#DFAB56]/30 bg-[#DFAB56]/10 text-[11px] font-mono tracking-widest text-[#DFAB56] uppercase mb-3 backdrop-blur-xl">
          <ShieldCheck className="w-4 h-4 text-[#DFAB56]" />
          <span>PRODUCTION-READY BLUEPRINT • جاهزية الـ 1,000 مستخدم والأمن السيبراني</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          معمارية سحابية محصنة لتحمل أقصى درجات الضغط.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 mt-3.5 leading-relaxed">
          تم بناء استامبي (Stampy) وفق الركائز المعمارية العشر الصارمة ونموذج الأمان الصفري (Zero Trust) لمنع التحرك العرضي وتصعيد الصلاحيات وحماية بيانات علامتك التجارية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {architecturalPillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-[#1A1614]/80 border border-white/10 hover:border-[#DFAB56]/40 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#3D2314] text-[#DFAB56] flex items-center justify-center border border-[#DFAB56]/30 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-[#DFAB56]/80">{item.num}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
`;
fs.writeFileSync(path.join(rootDir, 'src/features/marketing/components/MarketingTrustSection.tsx'), trustCode, 'utf-8');
console.log('✓ MarketingTrustSection.tsx updated with 10 Production Pillars');

// 5. Rewrite src/features/marketing/components/MarketingFooter.tsx
const footerCode = `'use client';

import React from 'react';
import Link from 'next/link';
import { StampyLogo } from '@/components/brand/StampyLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#DFAB56]/15 bg-[#0D0B0A] py-14 px-6 text-stone-400 text-xs font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <StampyLogo size="sm" showTagline={false} />
          <span className="text-stone-500 text-[11px]">
            منصة كروت التصوير التفاعلية وبرامج الولاء الذكية للمنشآت والعلامات التجارية
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-stone-400">
          <Link href="/privacy" className="hover:text-[#DFAB56] transition-colors">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-[#DFAB56] transition-colors">
            شروط الخدمة
          </Link>
          <Link href="/login" className="hover:text-[#DFAB56] transition-colors">
            دخول المنشأة
          </Link>
          <Link href="/c/stampy" className="hover:text-[#DFAB56] transition-colors">
            استوديو الزائر
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 text-center text-stone-500 text-[11px] font-mono">
        © {new Date().getFullYear()} STAMPY (استامبي). جميع الحقوق محفوظة • مبني وفق الركائز المعمارية السحابية الـ 10.
      </div>
    </footer>
  );
}
`;
fs.writeFileSync(path.join(rootDir, 'src/features/marketing/components/MarketingFooter.tsx'), footerCode, 'utf-8');
console.log('✓ MarketingFooter.tsx updated with Stampy brand');

// 6. Update src/app/page.tsx ambient mesh glows
const pagePath = path.join(rootDir, 'src/app/page.tsx');
let pageCode = fs.readFileSync(pagePath, 'utf-8');
pageCode = pageCode.replace(/bg-gradient-to-br from-\[#55100D\]\/25 via-\[#1A0706\]\/35 to-transparent/g, "bg-gradient-to-br from-[#3D2314]/30 via-[#1A1614]/40 to-transparent");
pageCode = pageCode.replace(/bg-gradient-to-tl from-\[#DD0200\]\/12 via-\[#55100D\]\/15 to-transparent/g, "bg-gradient-to-tl from-[#DFAB56]/15 via-[#3D2314]/20 to-transparent");
pageCode = pageCode.replace(/selection:bg-\[#DD0200\]/g, "selection:bg-[#DFAB56] selection:text-[#12100E]");
pageCode = pageCode.replace(/bg-\[#141313\]/g, "bg-[#12100E]");
fs.writeFileSync(pagePath, pageCode, 'utf-8');
console.log('✓ page.tsx ambient styling updated to Stampy Obsidian & Ochre');

console.log('\\nMARKETING COMPONENTS FULLY REBRANDED TO STAMPY!');

