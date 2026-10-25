/**
 * Image intake for the customer photobooth.
 *
 * Cloudflare Workers cannot load native modules, so `sharp` is not an option on
 * the deployment target. This module therefore works on plain Buffers:
 *
 *   - validates the real format from magic bytes (never the client MIME type),
 *   - strips EXIF / XMP / textual metadata for privacy,
 *   - reads the intrinsic dimensions.
 *
 * The browser already renders the strip on a canvas, so the bytes we receive
 * are a freshly encoded PNG or WebP. Re-encoding them again on the server would
 * only lose quality; the originals are stored once and served through signed
 * URLs.
 */

export type DetectedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export type ImageExtension = 'jpg' | 'png' | 'webp';

export interface ProcessedImageDerivatives {
  /** Bytes to store for the memory (metadata stripped). */
  optimizedBuffer: Buffer;
  /** Same bytes as `optimizedBuffer`; kept for the existing storage contract. */
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: 'original';
  mimeType: DetectedImageType;
  extension: ImageExtension;
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

function startsWith(buffer: Buffer, magic: number[]): boolean {
  if (buffer.length < magic.length) return false;
  return magic.every((byte, index) => buffer[index] === byte);
}

export function validateImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  const isJpeg = startsWith(buffer, JPEG_MAGIC);
  const isPng = startsWith(buffer, PNG_MAGIC);
  // A WebP file is RIFF....WEBP; RIFF alone is also used by WAV/AVI.
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

  return isJpeg || isPng || isWebp;
}

export function detectedImageType(buffer: Buffer): DetectedImageType | null {
  if (!validateImageMagicBytes(buffer)) return null;
  if (startsWith(buffer, JPEG_MAGIC)) return 'image/jpeg';
  if (startsWith(buffer, PNG_MAGIC)) return 'image/png';
  return 'image/webp';
}

function extensionFor(type: DetectedImageType): ImageExtension {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  return 'webp';
}

/* -------------------------------------------------------------------------- */
/* Dimensions                                                                 */
/* -------------------------------------------------------------------------- */

function jpegDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;

    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return { width: 0, height: 0 };
}

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  // IHDR is always the first chunk: 8-byte signature + length + type.
  if (buffer.length < 24 || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    return { width: 0, height: 0 };
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer: Buffer): { width: number; height: number } {
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return { width: 0, height: 0 };
}

export function imageDimensions(
  buffer: Buffer,
  type: DetectedImageType
): { width: number; height: number } {
  try {
    if (type === 'image/jpeg') return jpegDimensions(buffer);
    if (type === 'image/png') return pngDimensions(buffer);
    return webpDimensions(buffer);
  } catch {
    return { width: 0, height: 0 };
  }
}

/* -------------------------------------------------------------------------- */
/* Metadata stripping                                                         */
/* -------------------------------------------------------------------------- */

/** JPEG APP1 (EXIF/XMP), APP13 (IPTC/Photoshop) and COM segments. */
const JPEG_METADATA_MARKERS = new Set([0xe1, 0xed, 0xfe]);

function stripJpegMetadata(buffer: Buffer): Buffer {
  const parts: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];

    // Entropy-coded data starts here; copy the rest verbatim.
    if (marker === 0xda) {
      parts.push(buffer.subarray(offset));
      return Buffer.concat(parts);
    }
    if (marker === 0xd9) {
      parts.push(buffer.subarray(offset, offset + 2));
      return Buffer.concat(parts);
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) break;

    if (!JPEG_METADATA_MARKERS.has(marker)) {
      parts.push(buffer.subarray(offset, offset + 2 + length));
    }
    offset += 2 + length;
  }

  // Truncated or unparsable stream: keep the original rather than corrupt it.
  return offset >= buffer.length ? Buffer.concat(parts) : buffer;
}

const PNG_TEXT_CHUNKS = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);

function stripPngMetadata(buffer: Buffer): Buffer {
  const parts: Buffer[] = [buffer.subarray(0, 8)];
  let offset = 8;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > buffer.length) return buffer;

    if (!PNG_TEXT_CHUNKS.has(type)) parts.push(buffer.subarray(offset, end));
    offset = end;
    if (type === 'IEND') return Buffer.concat(parts);
  }

  return buffer;
}

function stripWebpMetadata(buffer: Buffer): Buffer {
  const parts: Buffer[] = [];
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (end > buffer.length) return buffer;

    if (fourCC !== 'EXIF' && fourCC !== 'XMP ') {
      parts.push(buffer.subarray(offset, end));
    }
    offset = end;
  }

  const body = Buffer.concat(parts);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8, 'ascii');
  return Buffer.concat([header, body]);
}

export function stripImageMetadata(buffer: Buffer, type: DetectedImageType): Buffer {
  try {
    if (type === 'image/jpeg') return stripJpegMetadata(buffer);
    if (type === 'image/png') return stripPngMetadata(buffer);
    return stripWebpMetadata(buffer);
  } catch {
    // Metadata removal is best effort; never fail an upload over it.
    return buffer;
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function processImageDerivatives(inputBuffer: Buffer): ProcessedImageDerivatives {
  const mimeType = detectedImageType(inputBuffer);
  if (!mimeType) {
    throw new Error('Invalid image file format. Only JPEG, PNG, and WebP are allowed.');
  }

  const clean = stripImageMetadata(inputBuffer, mimeType);
  const { width, height } = imageDimensions(clean, mimeType);

  return {
    optimizedBuffer: clean,
    thumbnailBuffer: clean,
    width,
    height,
    format: 'original',
    mimeType,
    extension: extensionFor(mimeType),
  };
}
