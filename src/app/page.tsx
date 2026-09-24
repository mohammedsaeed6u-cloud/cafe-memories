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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#DD0200] selection:text-white apple-font font-sans relative overflow-x-hidden">
      {/* Apple Luxury Ambient Mesh Glows in Background */}
      <div className="fixed top-0 left-0 w-[650px] h-[550px] bg-gradient-to-br from-[#DD0200]/22 via-[#55100D]/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-[#D9D9D9]/12 via-[#8E8E93]/6 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[700px] h-[500px] bg-gradient-to-tr from-[#1A0706]/40 via-[#55100D]/12 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#DD0200] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none"
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
