// @vitest-environment jsdom
/**
 * Viral-loop integration contract: the customer loyalty card must expose a
 * share action that routes through CardCanvasExportService.shareCardImage.
 *
 * Guards the SHARE step of the revenue loop (visit -> capture -> reward ->
 * SHARE -> live wall -> retention). If the share button is removed, stops
 * calling shareCardImage, or the service API changes shape, this fails.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CustomerLoyaltyCard } from '@/features/loyalty/CustomerLoyaltyCard';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';
import { CUSTOMER_THEMES } from '@/features/customization/CustomerCustomizerBar';

// Mock heavy browser-only collaborators; the contract under test is the
// WIRING (button -> service call), not the canvas painting itself.
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,QR') },
}));

vi.mock('@/lib/services/card-canvas-export.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/card-canvas-export.service')>();
  return {
    ...actual,
    CardCanvasExportService: {
      ...actual.CardCanvasExportService,
      exportCardToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,CARD'),
      shareCardImage: vi.fn().mockResolvedValue(true),
      downloadCardImage: vi.fn(),
    },
  };
});

vi.mock('@/lib/services/image-save.service', () => ({
  ImageSaveService: {
    saveImage: vi.fn().mockResolvedValue({ success: true, method: 'download' }),
  },
}));

vi.mock('@/components/wallet/useWalletSigning', () => ({
  useWalletSigning: () => 'disabled',
}));

vi.mock('@/lib/services/digital-wallet.service', () => ({
  DigitalWalletService: {
    getIssuedPasses: vi.fn().mockReturnValue([]),
    isWalletOutsourcingEnabled: vi.fn().mockReturnValue(false),
    getWalletPassStatus: vi.fn().mockResolvedValue({ enabled: false }),
  },
}));

const baseProps = {
  loyaltyData: {
    stampedCount: 3,
    maxSlots: 5,
    completedCardsCount: 0,
    customerPhone: '01055512345',
    cafeSlug: 'barq-studio',
  },
  giftTitle: 'مشروب مجاني',
  brandName: 'استوديو بَرَق',
  customerName: 'سارة',
  customerTitle: 'ضيف VIP مميز',
  themeConfig: CUSTOMER_THEMES[0],
  onOpenStaffStamp: vi.fn(),
  instagramHandle: '@barqstudio',
};

describe('Viral share loop: CustomerLoyaltyCard -> CardCanvasExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the share button beside the save action in the card action row', () => {
    render(<CustomerLoyaltyCard {...baseProps} />);

    const shareBtn = screen.getByRole('button', { name: /مشاركة الكارت/ });
    const saveBtn = screen.getByRole('button', { name: /حفظ الكارت في ألبوم الصور/ });

    expect(shareBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();
  });

  it('routes the share button click through CardCanvasExportService.shareCardImage', async () => {
    render(<CustomerLoyaltyCard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /مشاركة الكارت/ }));

    await waitFor(() => {
      expect(CardCanvasExportService.shareCardImage).toHaveBeenCalledTimes(1);
    });

    expect(CardCanvasExportService.exportCardToDataUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'سارة',
        cafeName: 'استوديو بَرَق',
        stampsCount: 3,
        totalSlots: 5,
      })
    );
    expect(CardCanvasExportService.shareCardImage).toHaveBeenCalledWith(
      'data:image/png;base64,CARD',
      expect.stringContaining('استوديو بَرَق')
    );
  });

  it('disables the share button while a card export is in flight (double-tap guard)', async () => {
    let resolveExport: (value: string) => void = () => {};
    const slowExport = new Promise<string>((resolve) => {
      resolveExport = resolve;
    });
    vi.mocked(CardCanvasExportService.exportCardToDataUrl).mockReturnValueOnce(slowExport);

    render(<CustomerLoyaltyCard {...baseProps} />);
    const shareBtn = screen.getByRole('button', { name: /مشاركة الكارت/ }) as HTMLButtonElement;

    fireEvent.click(shareBtn);
    await waitFor(() => {
      expect(shareBtn.disabled).toBe(true);
    });

    resolveExport('data:image/png;base64,LATE');
    await waitFor(() => {
      expect(shareBtn.disabled).toBe(false);
    });
  });

  it('share failure never breaks the card UI (silent catch, state resets)', async () => {
    vi.mocked(CardCanvasExportService.shareCardImage).mockRejectedValueOnce(
      new Error('share sheet crashed')
    );

    render(<CustomerLoyaltyCard {...baseProps} />);
    const shareBtn = screen.getByRole('button', { name: /مشاركة الكارت/ }) as HTMLButtonElement;

    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(shareBtn.disabled).toBe(false);
    });
    expect(
      screen.getByRole('button', { name: /حفظ الكارت في ألبوم الصور/ })
    ).toBeTruthy();
  });
});
