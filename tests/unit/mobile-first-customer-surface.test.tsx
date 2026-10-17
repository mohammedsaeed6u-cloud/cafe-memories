// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerExperienceContent } from '@/features/customer-experience/components/CustomerExperienceContent';
import { TappyCustomerWebCard } from '@/features/customer-experience/components/TappyCustomerWebCard';
import { WallStageView } from '@/features/live-wall/components/WallStageView';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-default-settings';

describe('Mobile-First BYOD Unified Customer Experience Suite', () => {
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

  it('renders exact 0 stamps count for new customers without 3-stamps bug', () => {
    render(
      <TappyCustomerWebCard
        cafeSlug="brew"
        settings={mockSettings}
        stampedCount={0}
        maxSlots={8}
        showSimulator={false}
      />
    );

    expect(screen.getByText('0 / 8')).toBeDefined();
    expect(screen.queryByText('+1 Stamp Tap')).toBeNull();
  });

  it('renders table attribution badge and unified surface with loyalty pass and 4-cuts studio', () => {
    const mockCx = {
      cafeSlug: 'brew',
      tableNumber: '04',
      activeTab: 'loyalty',
      setActiveTab: vi.fn(),
      totalCardSlots: 4,
      loyaltyData: { stampedCount: 2, totalPoints: 20 },
      loyaltyMaxVisits: 8,
      selectedFrame: {
        id: 'f1',
        name: 'Classic 2x6',
        widthCm: 5,
        heightCm: 15.2,
        bgColor: '#FFFFFF',
        shotCount: 4,
        borderColor: '#1A0A33',
      },
      accumulatedPhotos: ['data:image/png;base64,photo1'],
      currentDisplayPhotos: ['data:image/png;base64,photo1'],
      cardMode: 'korean_noir',
      setCardMode: vi.fn(),
      spotifyBg: '#121212',
      setSpotifyBg: vi.fn(),
      spotifyTrack: { title: 'Coffee Vibes', artist: 'Jazz' },
      setSpotifyTrack: vi.fn(),
      ticketSeat: 'Table 04',
      setTicketSeat: vi.fn(),
      settings: mockSettings,
      stickers: [],
      setStickers: vi.fn(),
      isStickerTrayOpen: false,
      setIsStickerTrayOpen: vi.fn(),
      handleAddSticker: vi.fn(),
      handleCommitPhoto: vi.fn(),
      handlePrintOrDownload: vi.fn(),
      handleWallConsent: vi.fn(),
      handleStaffStampSuccess: vi.fn(),
      setActiveCaptureSlot: vi.fn(),
      setIsCameraModalOpen: vi.fn(),
      regSuccessNotice: null,
      customization: { customerName: 'ضيفنا المميز' },
      customerPhone: '',
      customerName: 'ضيفنا المميز',
      setIsStaffStampModalOpen: vi.fn(),
      setIsNotificationModalOpen: vi.fn(),
      handleClearCustomer: vi.fn(),
      handleRegisterCustomer: vi.fn(),
      regName: '',
      setRegName: vi.fn(),
      regPhone: '',
      setRegPhone: vi.fn(),
    };

    render(<CustomerExperienceContent cx={mockCx as any} />);

    // Table attribution badge
    expect(screen.getByText('📍 طاولة 04')).toBeDefined();
    expect(screen.getByText(/تصوير وبث مباشر من مقعدك/i)).toBeDefined();

    // Unified surface: Both Loyalty Card and 4-Cuts Studio are present in default view
    expect(screen.getAllByText('Brew Specialty Roasters').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/استوديو الذكريات الكورية \(4-Cuts\)/i)).toBeDefined();
    expect(screen.getByText(/بث على شاشة (الكافيه|الصالة) الآن/i)).toBeDefined();
  });

  it('displays table number badge on 4K Live Wall when photo is cast from table', () => {
    const mockWallData = {
      currentMemory: {
        id: 'mem-101',
        customerName: 'Nasser & Friends',
        photoUrl: 'data:image/png;base64,mockphoto',
        tableNumber: '04',
        visitNumber: 3,
        timeFormatted: '14:20',
        caption: 'Coffee time at Table 04!',
      },
      cafeSlug: 'brew',
      brandName: 'Brew Specialty Roasters',
      brandLogoUrl: '',
      isOnline: true,
      setIsPaired: vi.fn(),
      toggleFullscreen: vi.fn(),
      lastSyncTime: '14:20:00',
      isPlaying: true,
      setIsPlaying: vi.fn(),
    };

    render(<WallStageView wall={mockWallData as any} />);

    expect(screen.getByText('📍 طاولة 04')).toBeDefined();
    expect(screen.getByText(/✦ 4-CUTS LIVE MEMORY • طاولة 04/i)).toBeDefined();
    expect(screen.getByText('Nasser & Friends')).toBeDefined();
  });
});
