import sharp from 'sharp';

export interface ProcessedImageDerivatives {
  optimizedBuffer: Buffer;
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: 'webp';
}

const MAGIC_BYTES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // 'RIFF'
};

export function validateImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  const isJpeg = MAGIC_BYTES.jpeg.every((byte, idx) => buffer[idx] === byte);
  const isPng = MAGIC_BYTES.png.every((byte, idx) => buffer[idx] === byte);
  const isWebp = MAGIC_BYTES.webp.every((byte, idx) => buffer[idx] === byte);

  return isJpeg || isPng || isWebp;
}

export async function processImageDerivatives(inputBuffer: Buffer): Promise<ProcessedImageDerivatives> {
  if (!validateImageMagicBytes(inputBuffer)) {
    throw new Error('Invalid image file format. Only JPEG, PNG, and WebP are allowed.');
  }

  // Strip EXIF metadata for privacy, auto-rotate based on orientation tag
  const baseSharp = sharp(inputBuffer).rotate();
  const metadata = await baseSharp.metadata();

  // 1. Optimized derivative: Max 1080x1080 WebP for Live Wall display
  const optimizedBuffer = await baseSharp
    .clone()
    .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  // 2. Thumbnail derivative: Max 320x320 WebP for mobile loyalty card
  const thumbnailBuffer = await baseSharp
    .clone()
    .resize(320, 320, { fit: 'cover' })
    .webp({ quality: 75, effort: 4 })
    .toBuffer();

  return {
    optimizedBuffer,
    thumbnailBuffer,
    width: metadata.width || 1080,
    height: metadata.height || 1080,
    format: 'webp',
  };
}
