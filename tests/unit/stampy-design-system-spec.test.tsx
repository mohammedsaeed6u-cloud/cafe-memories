// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoboothStrip } from '@/components/brand/PhotoboothStrip';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { StampyTicketCard } from '@/components/brand/StampyTicketCard';
import fs from 'fs';
import path from 'path';

describe('Stampy Design System Specification (v1.1.0)', () => {
  const ROOT = path.resolve(__dirname, '../..');

  it('PhotoboothStrip renders exactly according to Section 10.1 of Design System', () => {
    const onPrintMock = vi.fn();
    const photos = [
      { url: 'https://images.unsplash.com/photo-1.jpg', caption: 'Memory 1' },
      { url: 'https://images.unsplash.com/photo-2.jpg', caption: 'Memory 2' },
      { url: 'https://images.unsplash.com/photo-3.jpg', caption: 'Memory 3' },
    ];

    render(
      <PhotoboothStrip
        venueName="ROAST & CO. SPECIALTY"
        date="2026.10.10"
        serialNumber="STMP-8921"
        photos={photos}
        onDownloadOrPrint={onPrintMock}
      />
    );

    expect(screen.getByText('STAMPY. MEMORY STRIP')).toBeDefined();
    expect(screen.getByText('STMP-8921')).toBeDefined();
    expect(screen.getByText('ROAST & CO. SPECIALTY')).toBeDefined();
    expect(screen.getByText('2026.10.10')).toBeDefined();
    expect(screen.getByText('01')).toBeDefined();
    expect(screen.getByText('02')).toBeDefined();
    expect(screen.getByText('03')).toBeDefined();

    const actionBtn = screen.getByText('Take Your Photos Home ✨');
    expect(actionBtn).toBeDefined();
    fireEvent.click(actionBtn);
    expect(onPrintMock).toHaveBeenCalledTimes(1);
  });

  it('StampyLogo renders authentic ticket stub with iris aperture', () => {
    const { container: horiz } = render(<StampyLogo variant="horizontal" size="md" />);
    expect(horiz.querySelector('svg')).toBeDefined();

    const { container: hero } = render(<StampyLogo variant="hero" size="lg" />);
    expect(hero.querySelector('svg')).toBeDefined();
  });

  it('StampyTicketCard renders with 3D bottom bevel shadow and verified status', () => {
    render(
      <StampyTicketCard
        title="Elixir Coffee Club"
        subtitle="Flagship Roastery"
        serial="NO. 1874-902"
      >
        <span>5 / 10 Stamps</span>
      </StampyTicketCard>
    );

    expect(screen.getByText('Elixir Coffee Club')).toBeDefined();
    expect(screen.getByText('Flagship Roastery')).toBeDefined();
    expect(screen.getByText('5 / 10 Stamps')).toBeDefined();
    expect(screen.getByText('NO. 1874-902')).toBeDefined();
    expect(screen.getByText('VERIFIED')).toBeDefined();
  });

  it('CSS tokens in globals.css match the official emotional palette from Section 7', () => {
    const css = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8');
    expect(css).toContain('--stampy-ochre: #DFAB56');
    expect(css).toContain('--stampy-burgundy: #682025');
    expect(css).toContain('--stampy-forest: #2D5240');
    expect(css).toContain('--stampy-navy: #20304E');
    expect(css).toContain('--stampy-denim: #4A6B82');
    expect(css).toContain('--stampy-parchment: #F7F3EA');
    expect(css).toContain('--stampy-charcoal: #1B1B1E');
    expect(css).toContain('--stampy-bevel: #451215');
  });
});
