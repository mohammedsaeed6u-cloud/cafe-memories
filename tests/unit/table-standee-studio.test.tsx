// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableStandeeStudio } from '@/features/standees/components/TableStandeeStudio';
import { PrintService } from '@/lib/services/print.service';
import { BusinessSettings } from '@/types/photobooth';

// Mock PrintService
vi.mock('@/lib/services/print.service', () => ({
  PrintService: {
    printTableStand: vi.fn(),
  },
}));

describe('TableStandeeStudio Physical Hardware Engine', () => {
  const mockSettings: BusinessSettings = {
    branding: {
      name: 'Roastery Reserve',
      tagline: 'Artisanal Coffee & Memories',
      logoUrl: '',
      slug: 'roastery-reserve',
    },
    walletPassConfig: {
      colorHex: '#1A0A33',
    },
    stampConfig: {
      customEmoji: '☕',
    },
    loyaltyMaxVisits: 8,
    freeGiftOffer: {
      title: 'Free Specialty Flat White',
    },
  } as unknown as BusinessSettings;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Studio title, description, and action buttons', () => {
    render(<TableStandeeStudio settings={mockSettings} cafeSlug="roastery-reserve" />);

    expect(screen.getByText(/NFC & QR Table Standee Studio/i)).toBeDefined();
    expect(screen.getByText(/ستاندات الطاولات الفيزيائية/i)).toBeDefined();
    expect(screen.getByText(/طباعة فورية مقاس A6/i)).toBeDefined();
  });

  it('renders all three physical materials (Acrylic, Wood, Paper)', () => {
    render(<TableStandeeStudio settings={mockSettings} cafeSlug="roastery-reserve" />);

    expect(screen.getByText(/Matte Black Acrylic/i)).toBeDefined();
    expect(screen.getByText(/Nordic Oak Wood/i)).toBeDefined();
    expect(screen.getByText(/A6 Tent Card/i)).toBeDefined();
  });

  it('switches material when user clicks a material preset', () => {
    render(<TableStandeeStudio settings={mockSettings} cafeSlug="roastery-reserve" />);

    const woodButton = screen.getByText(/Nordic Oak Wood/i).closest('button');
    expect(woodButton).toBeDefined();
    if (woodButton) {
      fireEvent.click(woodButton);
      expect(screen.getByText(/مظهر خشبي عضوي دافئ/i)).toBeDefined();
    }
  });

  it('allows selecting different table presets and updates live preview', () => {
    render(<TableStandeeStudio settings={mockSettings} cafeSlug="roastery-reserve" />);

    const vipBtn = screen.getByText(/VIP/i).closest('button');
    expect(vipBtn).toBeDefined();
    if (vipBtn) {
      fireEvent.click(vipBtn);
      expect(screen.getAllByText(/VIP/i).length).toBeGreaterThan(0);
    }
  });

  it('triggers PrintService.printTableStand when user clicks print', () => {
    render(<TableStandeeStudio settings={mockSettings} cafeSlug="roastery-reserve" />);

    const printButton = screen.getByText(/طباعة فورية مقاس A6/i).closest('button');
    expect(printButton).toBeDefined();
    if (printButton) {
      fireEvent.click(printButton);
      expect(PrintService.printTableStand).toHaveBeenCalledWith(
        'standee-print-target',
        expect.objectContaining({
          cafeName: 'Roastery Reserve',
        })
      );
    }
  });
});
