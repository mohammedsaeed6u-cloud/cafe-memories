'use client';

import React, { useState } from 'react';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { GlobalSearchModal } from '@/components/ui/GlobalSearchModal';
import { FloatingContactButton } from '@/components/ui/FloatingContactButton';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';

import { MarketingHeader } from '@/features/marketing/components/MarketingHeader';
import { MarketingHero } from '@/features/marketing/components/MarketingHero';
import { MarketingVisualSteps } from '@/features/marketing/components/MarketingVisualSteps';
import { MarketingIndustryRules } from '@/features/marketing/components/MarketingIndustryRules';
import { MarketingDashboardMockup } from '@/features/marketing/components/MarketingDashboardMockup';
import { MarketingRetentionLoop } from '@/features/marketing/components/MarketingRetentionLoop';
import { StampyServicesSection } from '@/features/marketing/components/StampyServicesSection';
import { StampyRoiCalculator } from '@/features/marketing/components/StampyRoiCalculator';
import { MarketingPricing } from '@/features/marketing/components/MarketingPricing';
import { MarketingTrustSection } from '@/features/marketing/components/MarketingTrustSection';
import { MarketingFaq } from '@/features/marketing/components/MarketingFaq';
import { StampyContactSection } from '@/features/marketing/components/StampyContactSection';
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#1B1B1E] selection:bg-[#682025] selection:text-white font-sans relative overflow-x-hidden">
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#682025] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none"
      >
        تخطي إلى المحتوى الرئيسي
      </a>

      {/* Reading Progress Indicator */}
      <ScrollProgressBar />

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Sticky Header */}
      <MarketingHeader onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Main Landmark */}
      <main id="main-content" tabIndex={-1} className="relative z-10 outline-none">
        {/* 1. Hero Section with Above-The-Fold 10-Stamp Row & Simulator */}
        <MarketingHero />

        {/* 2. Step-by-Step Experience (Three taps to loyal) */}
        <MarketingVisualSteps />

        {/* 3. Industry Marquee & Flexible Earning Rules (Your Shop, Your Rules) */}
        <MarketingIndustryRules />

        {/* 4. Embedded Live macOS Merchant Dashboard Window (Insights, Card Designer, Promotions) */}
        <MarketingDashboardMockup />

        {/* 5. Retention Engine: iPhone Lockscreen Stack & 6 SaaS Pillars */}
        <MarketingRetentionLoop />

        {/* 6. Exclusive Superior Services: Photobooth Strip Studio, 4K Live Wall Signage, Staff Cashier POS */}
        <StampyServicesSection />

        {/* 7. Interactive ROI & Retention Calculator */}
        <StampyRoiCalculator />

        {/* 8. SaaS Subscription Pricing Table */}
        <MarketingPricing />

        {/* 9. Security & Privacy Trust Section */}
        <MarketingTrustSection />

        {/* 10. FAQ Accordion (Objection Buster) */}
        <MarketingFaq />

        {/* 11. Final Risk-Free CTA */}
        <StampyContactSection />
      </main>

      {/* Footer */}
      <MarketingFooter />

      {/* Floating Utilities */}
      <ScrollToTopButton />
      <FloatingContactButton />
      <CookieConsentBanner />
    </div>
  );
}
