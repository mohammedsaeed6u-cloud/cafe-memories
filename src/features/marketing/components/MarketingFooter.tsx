'use client';

import React from 'react';
import Link from 'next/link';
import { StampyLogo } from '@/components/brand/StampyLogo';

export function MarketingFooter() {
  return (
    <footer className="tappy-footer" data-purpose="footer">
      <div className="foot-grid">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StampyLogo variant="horizontal" size="sm" theme="dark" showTagline={false} />
          </div>
          <p className="text-xs text-white/70 leading-relaxed max-w-sm">
            The Apple & Google Wallet loyalty platform for modern coffee shops, barbers, restaurants, and retail spaces.
            <br />
            المنظومة السحابية الرائدة لبطاقات الولاء الرقمية واستوديو الذكريات التفاعلي.
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 font-mono text-[10px] font-bold">
              EST. 2026 • RIYADH & CLOUDFLARE GLOBAL EDGE
            </span>
          </div>
        </div>

        {/* Product Column */}
        <div className="foot-col">
          <div className="foot-col-t">PRODUCT</div>
          <ul>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#rules">Rules & Rewards</a></li>
            <li><a href="#dashboard">Live Dashboard</a></li>
            <li><a href="#operations">Lockscreen Push</a></li>
            <li><a href="#services">Photobooth Studio</a></li>
            <li><a href="#pricing">Pricing Plans</a></li>
          </ul>
        </div>

        {/* Solutions Column */}
        <div className="foot-col">
          <div className="foot-col-t">SOLUTIONS</div>
          <ul>
            <li><a href="#rules">Coffee Shops & Roasters</a></li>
            <li><a href="#rules">Barbershops & Salons</a></li>
            <li><a href="#rules">Bakeries & Pastries</a></li>
            <li><a href="#rules">Pharmacies & Retail</a></li>
            <li><a href="#rules">Car Washes & Auto</a></li>
            <li><a href="#rules">Chains & Multi-branch</a></li>
          </ul>
        </div>

        {/* Quick Access Column */}
        <div className="foot-col">
          <div className="foot-col-t">PORTALS</div>
          <ul>
            <li><Link href="/login?tab=signin">تسجيل الدخول</Link></li>
            <li><Link href="/login?tab=signup">إنشاء حساب مجاناً</Link></li>
            <li><Link href="/dashboard">لوحة التحكم السحابية</Link></li>
            <li><Link href="/terminal">محطة الكاشير POS</Link></li>
            <li><Link href="/wall/screen-1">شاشة الصالة 4K</Link></li>
            <li><Link href="/c/stampy">كارت الولاء الحي</Link></li>
            <li><Link href="/admin">بورتال إدارة الساس (Admin)</Link></li>
            <li><Link href="/kiosk/stampy">كشك التابلت (Tablet Kiosk)</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="foot-col">
          <div className="foot-col-t">LEGAL & TRUST</div>
          <ul>
            <li><Link href="/privacy">سياسة الخصوصية GDPR</Link></li>
            <li><Link href="/terms">شروط الاستخدام</Link></li>
            <li><a href="#security">معايير أمان Apple PKPass</a></li>
            <li><a href="#sla">اتفاقية مستوى الخدمة 99.9%</a></li>
            <li><a href="#contact">الدعم الفني المباشر</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="foot-bot">
        <span>© 2026 Stampy Technologies Inc. All rights reserved.</span>
        <div className="flex items-center gap-4 text-xs">
          <span>Made with passion for real retail connections.</span>
          <span className="text-[#f0456a]">✦</span>
          <span>Apple & Google Wallet Verified Partner</span>
        </div>
      </div>
    </footer>
  );
}
