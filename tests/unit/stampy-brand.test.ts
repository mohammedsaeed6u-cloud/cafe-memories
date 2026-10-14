import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '@/lib/brand';

const root = process.cwd();
const asset = (name: string) => readFileSync(join(root, 'public/brand', name));

describe('official STAMPY brand port', () => {
  it('retains the original ticket and aperture, with lowercase wordmark and dot', () => {
    const svg = asset('01-stampy-hero-logo.svg').toString();
    expect(svg).toContain('rotate(-6.42)');
    expect(svg).toContain('stampy.');
    expect(svg).toContain('#DFAB56');
    const markup = renderToStaticMarkup(createElement(StampyLogo, {
      variant: 'horizontal', size: 'sm', showTagline: false,
    }));
    expect(markup).toContain('stampy.');
    expect(markup).toContain('Stampy Official Ticket Mark');
    for (const file of readdirSync(join(root, 'public/brand')).filter((name) => name.endsWith('.svg'))) {
      const content = asset(file).toString();
      expect(content).not.toMatch(/@import|<script\b|\bonload=|\bonerror=/i);
    }
  });

  it('ships the correct PNG dimensions for browser and PWA launchers', () => {
    for (const size of [32, 64, 180, 192, 512, 1024]) {
      const png = asset(`stampy-app-icon-${size}.png`);
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
    const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8'));
    expect(manifest.short_name).toBe('stampy.');
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toContain('/brand/stampy-app-icon-512.png');
    // Public assets live below /brand/, but /brand alone is an authenticated
    // merchant page. A broad proxy matcher turns favicons into login HTML.
    const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
    expect(proxy).toMatch(/^\s*"\/brand",\s*$/m);
    expect(proxy).not.toMatch(/^\s*"\/brand\/:path\*",\s*$/m);
  });

  it('uses the supplied accessible palette without changing A6/permission boundaries', () => {
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
    expect(css).toContain('--stampy-ochre: #DFAB56');
    expect(css).toContain('--stampy-burgundy: #682025');
    expect(css).toContain('--stampy-parchment: #FAF5EB');
    expect(css).toContain('.stampy-ticket-card::before');
    expect(css).toContain('.stampy-stamp');
    expect(DEFAULT_PRIMARY).toBe('#682025');
    expect(DEFAULT_ACCENT).toBe('#DFAB56');
    const print = readFileSync(join(root, 'src/components/customer/KeepsakePrintClient.tsx'), 'utf8');
    expect(print).toContain('@page { size: 105mm 148mm; margin: 0; }');
    expect(print).toContain('stampy. × {story.organizationName}');
    expect(print).toContain('brand/stampy-app-icon-64.png');
  });
});
