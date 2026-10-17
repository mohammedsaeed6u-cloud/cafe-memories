// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TappyCustomerWebCard } from '@/features/customer-experience/components/TappyCustomerWebCard';
import { TappyMerchantDashboard } from '@/features/dashboard-shell/components/TappyMerchantDashboard';
import { WallStageView } from '@/features/live-wall/components/WallStageView';
import { CustomerPhotoboothStudioTab } from '@/features/customer-experience/components/CustomerPhotoboothStudioTab';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-default-settings';

describe('Tappy Full Experience & Architecture Test Suite', () => {
  const mockSettings = {
    ...DEFAULT_BUSINESS_SETTINGS,
    branding: {
      ...DEFAULT_BUSINESS_SETTINGS.branding,
      name: 'Brew Specialty Roasters',
    },
    locationConfig: {
      enabled: true,
      latitude: 24.7015,
      longitude: 46.6854,
      relevantText: 'Flagship Roastery · Tahlia St',
    },
    freeGiftOffer: {
      title: 'Free Signature V60',
    },
    loyaltyMaxVisits: 8,
  };

  describe('TappyCustomerWebCard (Tactile Paper Stamp Card)', () => {
    it('renders authentic paper card header, branch, and stamp count', () => {
      render(
        <TappyCustomerWebCard
          cafeSlug="brew"
          settings={mockSettings}
          stampedCount={3}
          maxSlots={8}
          customerName="Nasser K."
        />
      );

      expect(screen.getByText('Brew Specialty Roasters')).toBeDefined();
      expect(screen.getByText('Flagship Roastery · Tahlia St')).toBeDefined();
      expect(screen.getByText('Nasser K.')).toBeDefined();
      expect(screen.getByText('3 / 8')).toBeDefined();
      expect(screen.getByText(/Collect/i)).toBeDefined();
    });

    it('renders official Apple Wallet and Google Wallet save badges', () => {
      render(
        <TappyCustomerWebCard
          cafeSlug="brew"
          settings={mockSettings}
          stampedCount={3}
          maxSlots={8}
        />
      );

      const appleBtn = screen.getByText('Add to Apple Wallet');
      const googleBtn = screen.getByText('Save to Google Wallet');
      expect(appleBtn).toBeDefined();
      expect(googleBtn).toBeDefined();

      const appleLink = appleBtn.closest('a');
      expect(appleLink?.getAttribute('href')).toContain('/api/v1/apple-pass-service/pass/brew');
    });

    it('increments stamps and triggers callback when using the interactive simulator', () => {
      const onAddStampMock = vi.fn();
      render(
        <TappyCustomerWebCard
          cafeSlug="brew"
          settings={mockSettings}
          stampedCount={3}
          maxSlots={8}
          onAddStamp={onAddStampMock}
        />
      );

      const tapBtn = screen.getByText('+1 Stamp Tap');
      fireEvent.click(tapBtn);

      expect(onAddStampMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('4 / 8')).toBeDefined();
    });

    it('unlocks counter redemption and displays counterfeit-proof live receipt with live clock', () => {
      render(
        <TappyCustomerWebCard
          cafeSlug="brew"
          settings={mockSettings}
          stampedCount={8}
          maxSlots={8}
        />
      );

      expect(screen.getByText(/Card Completed!/i)).toBeDefined();
      const redeemBtn = screen.getByText('Redeem Now');
      expect(redeemBtn).toBeDefined();

      fireEvent.click(redeemBtn);

      // Verify counterfeit-proof receipt elements
      expect(screen.getByText('Verified Counterfeit-Proof Receipt')).toBeDefined();
      expect(screen.getByText('Live Verification Clock')).toBeDefined();
      expect(screen.getByText(/Anti-screenshot security token/i)).toBeDefined();
      expect(screen.getByText('Barista Tap: Confirm Redemption')).toBeDefined();
    });
  });

  describe('TappyMerchantDashboard (Business OS All Sub-Views)', () => {
    it('renders desktop browser window chrome with dashboard.runtappy.com', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      expect(screen.getByText(/dashboard.runtappy.com/i)).toBeDefined();
      expect(screen.getByText('Live Cloud Engine')).toBeDefined();
      expect(screen.getByText('Insights & Analytics')).toBeDefined();
    });

    it('renders all primary KPI cards and peak hours matrix in Insights view', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      expect(screen.getByText('Total Taps')).toBeDefined();
      expect(screen.getByText('New Customers')).toBeDefined();
      expect(screen.getByText('Return Rate')).toBeDefined();
      expect(screen.getByText('Rewards Redeemed')).toBeDefined();
      expect(screen.getByText('Peak Hours Matrix')).toBeDefined();
      expect(screen.getByText('Branches League Table')).toBeDefined();
    });

    it('switches to Tappy Card Designer and flips between front and back pass', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      const designerTab = screen.getByText('Tappy Card Designer');
      fireEvent.click(designerTab);

      expect(screen.getByText(/Live customization/i)).toBeDefined();
      expect(screen.getByText('Brand Accent & Pass Color')).toBeDefined();
      expect(screen.getByText('Target Reward Milestone Title')).toBeDefined();

      // Flip card to back
      const flipBtn = screen.getByText('Flip ↻');
      fireEvent.click(flipBtn);
      expect(screen.getByText('Pass Information & Rules')).toBeDefined();
    });

    it('switches to Programs & Rules and configures earning and anti-fraud velocity limits', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      const programsTab = screen.getByText('Programs & Rules');
      fireEvent.click(programsTab);

      expect(screen.getByText('Stamp Earning Trigger')).toBeDefined();
      expect(screen.getByText('First-Visit Head Start Bonus')).toBeDefined();
      expect(screen.getByText('Anti-Abuse Velocity Guard')).toBeDefined();
      expect(screen.getByText('Minimum Cooldown Between Taps')).toBeDefined();
    });

    it('switches to Rewards Ladder and allows adding a new milestone tier', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      const rewardsTab = screen.getByText('Rewards Ladder');
      fireEvent.click(rewardsTab);

      expect(screen.getByText('Tiered Rewards Ladder')).toBeDefined();
      expect(screen.getByText('+ Add New Reward Milestone Tier')).toBeDefined();

      const input = screen.getByPlaceholderText('e.g. Free Dessert or 20% Off');
      fireEvent.change(input, { target: { value: 'Free Cheesecake' } });

      const addBtn = screen.getByText('Add Milestone Tier');
      fireEvent.click(addBtn);

      expect(screen.getByText('Free Cheesecake')).toBeDefined();
    });

    it('switches to Promotions, Branches, Team, Settings, Billing, and Support views seamlessly', () => {
      render(<TappyMerchantDashboard settings={mockSettings} />);

      // Promotions
      fireEvent.click(screen.getByText(/Promotions/i));
      expect(screen.getByText('Broadcast Lockscreen Push')).toBeDefined();

      // Branches
      fireEvent.click(screen.getByText(/Branches & Fleet/i));
      expect(screen.getByText('+ Register New Branch Location')).toBeDefined();

      // Team
      fireEvent.click(screen.getByText(/Team & Cashiers/i));
      expect(screen.getByText('+ Add New Team Member')).toBeDefined();

      // Settings
      fireEvent.click(screen.getByText('Settings & Fraud'));
      expect(screen.getByText('Cryptographic NFC Tag Signature')).toBeDefined();

      // Billing
      fireEvent.click(screen.getByText('Plans & Billing'));
      expect(screen.getByText(/Pro Chain Plan · Active/i)).toBeDefined();
      expect(screen.getByText('Active Wallet Passes')).toBeDefined();

      // Support
      fireEvent.click(screen.getByText('Concierge Help'));
      expect(screen.getByText('Order NFC Counter Stands')).toBeDefined();
    });
  });

  describe('4K Live TV Wall & Photobooth Cast Integration', () => {
    it('renders WallStageView with luxury photo vitrine, film numbering, and golden QR standee', () => {
      const mockWallData = {
        currentMemory: {
          id: 'mem-1',
          customerName: 'Sarah Hassan',
          photoUrl: 'data:image/png;base64,mockphoto',
          visitNumber: 5,
          timeFormatted: '15:30',
          caption: 'Best specialty latte in town!',
        },
        cafeSlug: 'brew',
        brandName: 'Brew Specialty Roasters',
        brandLogoUrl: '',
        isOnline: true,
        setIsPaired: vi.fn(),
        toggleFullscreen: vi.fn(),
        lastSyncTime: '15:30:12',
        isPlaying: true,
        setIsPlaying: vi.fn(),
      };

      render(<WallStageView wall={mockWallData as any} />);

      expect(screen.getByText('Sarah Hassan')).toBeDefined();
      expect(screen.getByText(/الزيارة رقم #5/i)).toBeDefined();
      expect(screen.getByText('"Best specialty latte in town!"')).toBeDefined();
      expect(screen.getByText(/SCAN WITH CAMERA/i)).toBeDefined();
      expect(screen.getByText(/4-CUTS LIVE MEMORY/i)).toBeDefined();
    });

    it('renders CustomerPhotoboothStudioTab with Cast to TV Wall and Memory Stamp actions', () => {
      const handleWallConsentMock = vi.fn();
      const handleStaffStampSuccessMock = vi.fn();

      const mockCx = {
        totalCardSlots: 3,
        selectedFrame: {
          id: 'f1',
          name: 'Classic 2x6',
          widthCm: 5,
          heightCm: 15.2,
          bgColor: '#FFFFFF',
          shotCount: 3,
          borderColor: '#1A0A33',
        },
        accumulatedPhotos: ['data:image/png;base64,p1'],
        currentDisplayPhotos: ['data:image/png;base64,p1'],
        cardMode: 'korean_noir',
        setCardMode: vi.fn(),
        spotifyBg: '#121212',
        setSpotifyBg: vi.fn(),
        spotifyTrack: { title: 'Coffee Song', artist: 'Lofi Vibes' },
        setSpotifyTrack: vi.fn(),
        ticketSeat: 'VIP 01',
        setTicketSeat: vi.fn(),
        settings: mockSettings,
        stickers: [],
        setStickers: vi.fn(),
        isStickerTrayOpen: false,
        setIsStickerTrayOpen: vi.fn(),
        handleAddSticker: vi.fn(),
        handleCommitPhoto: vi.fn(),
        handlePrintOrDownload: vi.fn(),
        handleWallConsent: handleWallConsentMock,
        handleStaffStampSuccess: handleStaffStampSuccessMock,
        setActiveTab: vi.fn(),
        setActiveCaptureSlot: vi.fn(),
        setIsCameraModalOpen: vi.fn(),
      };

      render(<CustomerPhotoboothStudioTab cx={mockCx as any} />);

      // Verify the new Live Actions Bar
      const castBtn = screen.getByText(/بث على شاشة (الكافيه|الصالة) الآن/i);
      const stampBtn = screen.getByText('+1 ختم الذكرى بكارتك');

      expect(castBtn).toBeDefined();
      expect(stampBtn).toBeDefined();

      // Trigger Cast to TV Wall
      fireEvent.click(castBtn);
      expect(handleWallConsentMock).toHaveBeenCalledWith(true);
      expect(screen.getByText(/صورتك تبث الآن على شاشة (الكافيه|الصالة)/i)).toBeDefined();

      // Trigger Memory Stamp
      fireEvent.click(stampBtn);
      expect(handleStaffStampSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});
