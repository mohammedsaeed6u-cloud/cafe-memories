import { describe, it, expect } from 'vitest';
import { validateImageMagicBytes, processImageDerivatives } from '@/lib/services/images';
import sharp from 'sharp';

describe('Image Sanitization & WebP Processing Pipeline', () => {
  it('validates JPEG, PNG, and WebP magic bytes correctly', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00]);
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ executable

    expect(validateImageMagicBytes(jpegBuffer)).toBe(true);
    expect(validateImageMagicBytes(pngBuffer)).toBe(true);
    expect(validateImageMagicBytes(webpBuffer)).toBe(true);
    expect(validateImageMagicBytes(exeBuffer)).toBe(false);
  });

  it('generates optimized (1080px) and thumbnail (320px) WebP derivatives', async () => {
    // Create a synthetic 1600x1200 PNG test image
    const syntheticBuffer = await sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: { r: 147, g: 84, b: 54 }, // Coffee warm brown
      },
    })
      .png()
      .toBuffer();

    const result = await processImageDerivatives(syntheticBuffer);

    expect(result.format).toBe('webp');
    expect(result.optimizedBuffer.length).toBeGreaterThan(0);
    expect(result.thumbnailBuffer.length).toBeGreaterThan(0);

    // Verify metadata of derivatives
    const optMeta = await sharp(result.optimizedBuffer).metadata();
    const thumbMeta = await sharp(result.thumbnailBuffer).metadata();

    expect(optMeta.format).toBe('webp');
    expect(optMeta.width).toBeLessThanOrEqual(1080);

    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBe(320);
    expect(thumbMeta.height).toBe(320);
  });
});
