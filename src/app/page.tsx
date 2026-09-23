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
import { MarketingRetentionLoop } from '@/features/marketing/components/MarketingRetentionLoop';
import { MarketingWallSection } from '@/features/marketing/components/MarketingWallSection';
import { MarketingPricing } from '@/features/marketing/components/MarketingPricing';
import { MarketingTrustSection } from '@/features/marketing/components/MarketingTrustSection';
import { MarketingFaq } from '@/features/marketing/components/MarketingFaq';
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#0E1A16] text-[#3B2F2A] dark:text-[#FAF6EE] selection:bg-[#B85C43] selection:text-white font-cairo transition-colors duration-250">
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1E3A32] focus:text-[#FAF6EE] focus:rounded-xl focus:shadow-lg focus:outline-none"
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
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Hero Section */}
        <MarketingHero />

        {/* Step-by-Step Experience */}
        <MarketingVisualSteps />

        {/* Guest Retention Loop */}
        <MarketingRetentionLoop />

        {/* TV Live Wall Showcase */}
        <MarketingWallSection />

        {/* Transparent Pricing */}
        <MarketingPricing />

        {/* Security & Privacy Trust Section */}
        <MarketingTrustSection />

        {/* FAQ Accordion */}
        <MarketingFaq />
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
