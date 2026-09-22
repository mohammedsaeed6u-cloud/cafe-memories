import { describe, it, expect } from 'vitest';
import { withUtm } from '@/lib/utils/utm';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { GlobalSearchModal } from '@/components/ui/GlobalSearchModal';
import { MobileNavMenu } from '@/components/ui/MobileNavMenu';
import { FloatingContactButton } from '@/components/ui/FloatingContactButton';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { NewsletterSignup } from '@/components/ui/NewsletterSignup';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { DestructiveConfirmModal } from '@/components/ui/DestructiveConfirmModal';
import { CodeSnippetBlock } from '@/components/ui/CodeSnippetBlock';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';
import { OutboundLink } from '@/components/ui/OutboundLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

describe('SaaS Elevation - UTM Utilities & Tracking', () => {
  it('appends default UTM parameters to external URLs', () => {
    const url = 'https://example.com/blog';
    const result = withUtm(url);
    expect(result).toContain('utm_source=memories_saas');
    expect(result).toContain('utm_medium=web_referral');
    expect(result).toContain('utm_campaign=platform_showcase');
  });

  it('allows overriding UTM parameters with custom campaign details', () => {
    const url = 'https://wa.me/201000000000';
    const result = withUtm(url, {
      source: 'memories_saas',
      medium: 'whatsapp_concierge',
      campaign: 'lead_inquiry',
    });
    expect(result).toContain('utm_source=memories_saas');
    expect(result).toContain('utm_medium=whatsapp_concierge');
    expect(result).toContain('utm_campaign=lead_inquiry');
  });

  it('leaves internal relative paths and anchors unchanged', () => {
    expect(withUtm('/c/espresso-lab')).toBe('/c/espresso-lab');
    expect(withUtm('#faq')).toBe('#faq');
    expect(withUtm('/terms')).toBe('/terms');
  });
});

describe('SaaS Elevation - UI Components Definitions', () => {
  it('exports all 15 newly created vibe-coded UI components cleanly', () => {
    expect(DarkModeToggle).toBeDefined();
    expect(ScrollProgressBar).toBeDefined();
    expect(ScrollToTopButton).toBeDefined();
    expect(GlobalSearchModal).toBeDefined();
    expect(MobileNavMenu).toBeDefined();
    expect(FloatingContactButton).toBeDefined();
    expect(FaqAccordion).toBeDefined();
    expect(NewsletterSignup).toBeDefined();
    expect(PasswordInput).toBeDefined();
    expect(CookieConsentBanner).toBeDefined();
    expect(DestructiveConfirmModal).toBeDefined();
    expect(CodeSnippetBlock).toBeDefined();
    expect(LastUpdatedBadge).toBeDefined();
    expect(OutboundLink).toBeDefined();
    expect(LoadingSpinner).toBeDefined();
  });
});
