import { describe, it, expect } from 'vitest';
import {
  detectedImageType,
  imageDimensions,
  processImageDerivatives,
  stripImageMetadata,
  validateImageMagicBytes,
} from '@/lib/services/images';

function pngChunk(type: string, data: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 'ascii');
  return Buffer.concat([header, data, Buffer.alloc(4)]); // CRC is not verified
}

function makePng(width: number, height: number, extraChunks: Buffer[] = []): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    ...extraChunks,
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeJpeg(width: number, height: number, app1Payload?: Buffer): Buffer {
  const app1 = app1Payload
    ? Buffer.concat([
        Buffer.from([0xff, 0xe1, 0x00, app1Payload.length + 2]),
        app1Payload,
      ])
    : Buffer.alloc(0);

  const sof = Buffer.alloc(19);
  sof[0] = 0xff;
  sof[1] = 0xc0;
  sof.writeUInt16BE(17, 2);
  sof[4] = 8; // precision
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  sof[9] = 3; // components

  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    app1,
    sof,
    Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
    Buffer.from([0x12, 0x34, 0x56, 0xff, 0xd9]),
  ]);
}

function makeWebp(width: number, height: number, extraChunks: Buffer[] = []): Buffer {
  const vp8x = Buffer.alloc(10);
  vp8x.writeUIntLE(width - 1, 4, 3);
  vp8x.writeUIntLE(height - 1, 7, 3);
  const chunks = [
    Buffer.concat([Buffer.from('VP8X', 'ascii'), Buffer.from([10, 0, 0, 0]), vp8x]),
    ...extraChunks,
  ];
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8, 'ascii');
  return Buffer.concat([header, body]);
}

describe('image intake', () => {
  it('validates JPEG, PNG, and WebP magic bytes correctly', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const pngBuffer = makePng(2, 2);
    const webpBuffer = makeWebp(2, 2);
    const riffButNotWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);

    expect(validateImageMagicBytes(jpegBuffer)).toBe(true);
    expect(validateImageMagicBytes(pngBuffer)).toBe(true);
    expect(validateImageMagicBytes(webpBuffer)).toBe(true);
    expect(validateImageMagicBytes(riffButNotWebp)).toBe(false);
    expect(validateImageMagicBytes(exeBuffer)).toBe(false);
  });

  it('reports the real format and dimensions instead of trusting the MIME type', () => {
    const png = makePng(1080, 1620);
    const jpeg = makeJpeg(800, 600);
    const webp = makeWebp(640, 480);

    expect(detectedImageType(png)).toBe('image/png');
    expect(detectedImageType(jpeg)).toBe('image/jpeg');
    expect(detectedImageType(webp)).toBe('image/webp');

    expect(imageDimensions(png, 'image/png')).toEqual({ width: 1080, height: 1620 });
    expect(imageDimensions(jpeg, 'image/jpeg')).toEqual({ width: 800, height: 600 });
    expect(imageDimensions(webp, 'image/webp')).toEqual({ width: 640, height: 480 });
  });

  it('strips EXIF from JPEG while keeping the scan data intact', () => {
    const exif = Buffer.concat([
      Buffer.from('Exif\0\0', 'binary'),
      Buffer.from('GPSLatitude=24.7136;GPSLongitude=46.6753', 'ascii'),
    ]);
    const jpeg = makeJpeg(800, 600, exif);

    expect(jpeg.includes(Buffer.from('GPSLatitude'))).toBe(true);
    const clean = stripImageMetadata(jpeg, 'image/jpeg');

    expect(clean.includes(Buffer.from('GPSLatitude'))).toBe(false);
    expect(clean.includes(Buffer.from('Exif'))).toBe(false);
    expect(clean.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    expect(clean.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
    expect(clean.includes(Buffer.from([0x12, 0x34, 0x56]))).toBe(true);
    expect(imageDimensions(clean, 'image/jpeg')).toEqual({ width: 800, height: 600 });
  });

  it('strips PNG text and EXIF chunks without breaking the image', () => {
    const text = Buffer.from('Author\0Guest', 'latin1');
    const exif = Buffer.from('GPSLatitude=24.7136', 'ascii');
    const png = makePng(320, 480, [pngChunk('tEXt', text), pngChunk('eXIf', exif)]);

    const clean = stripImageMetadata(png, 'image/png');
    expect(clean.includes(Buffer.from('Author'))).toBe(false);
    expect(clean.includes(Buffer.from('GPSLatitude'))).toBe(false);
    expect(clean.toString('ascii', 12, 16)).toBe('IHDR');
    expect(clean.toString('ascii', clean.length - 8, clean.length - 4)).toBe('IEND');
    expect(imageDimensions(clean, 'image/png')).toEqual({ width: 320, height: 480 });
  });

  it('drops WebP EXIF chunks and fixes the RIFF size', () => {
    const exifData = Buffer.from('GPSLatitude=24.7136', 'ascii');
    const exifChunk = Buffer.concat([
      Buffer.from('EXIF', 'ascii'),
      Buffer.from([exifData.length, 0, 0, 0]),
      exifData,
      exifData.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0),
    ]);
    const webp = makeWebp(640, 480, [exifChunk]);

    const clean = stripImageMetadata(webp, 'image/webp');
    expect(clean.includes(Buffer.from('GPSLatitude'))).toBe(false);
    expect(clean.readUInt32LE(4)).toBe(clean.length - 8);
    expect(imageDimensions(clean, 'image/webp')).toEqual({ width: 640, height: 480 });
  });

  it('returns the sanitized bytes once with a real format and extension', () => {
    const png = makePng(1080, 1620, [pngChunk('tEXt', Buffer.from('secret\0value', 'latin1'))]);
    const result = processImageDerivatives(png);

    expect(result.format).toBe('original');
    expect(result.mimeType).toBe('image/png');
    expect(result.extension).toBe('png');
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1620);
    expect(result.optimizedBuffer).toBe(result.thumbnailBuffer);
    expect(result.optimizedBuffer.includes(Buffer.from('secret'))).toBe(false);
  });

  it('rejects bytes that are not a supported image', () => {
    expect(() => processImageDerivatives(Buffer.from('MZ not an image at all'))).toThrow(
      /Invalid image file format/
    );
  });
});
