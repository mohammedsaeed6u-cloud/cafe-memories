/**
 * Google Wallet Passes Engine
 *
 * Implements the official Google Wallet Passes API architecture (LoyaltyClass & LoyaltyObject)
 * for Android devices, Smart Tap NFC, and native notification shade updates.
 *
 * Spec reference:
 * https://developers.google.com/wallet/retail/loyalty-cards
 */

import { DigitalWalletPassData } from './digital-wallet.service';

export interface GoogleLoyaltyClass {
  id: string;
  issuerName: string;
  programName: string;
  programLogo: {
    sourceUri: {
      uri: string;
    };
  };
  hexBackgroundColor: string;
  reviewStatus: 'UNDER_REVIEW' | 'APPROVED';
}

export interface GoogleLoyaltyObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  accountId: string;
  accountName: string;
  loyaltyPoints: {
    label: string;
    balance: {
      string: string;
    };
  };
  barcode: {
    type: 'QR_CODE' | 'PDF_417' | 'AZTEC';
    value: string;
    alternateText: string;
  };
  messages?: Array<{
    header: string;
    body: string;
  }>;
}

export const GoogleWalletEngine = {
  /**
   * Generates a Google Wallet LoyaltyClass identifier.
   */
  generateClassId(issuerId: string, cafeSlug: string): string {
    return `${issuerId}.${cafeSlug}_loyalty_class`;
  },

  /**
   * Generates a customer-specific Google Wallet LoyaltyObject identifier.
   */
  generateObjectId(issuerId: string, cafeSlug: string, customerPhone: string): string {
    const cleanPhone = customerPhone.replace(/[^a-zA-Z0-9_-]/g, '') || 'guest';
    return `${issuerId}.${cafeSlug}_${cleanPhone}_obj`;
  },

  /**
   * Builds the official Google Wallet LoyaltyClass schema.
   */
  buildLoyaltyClass(data: DigitalWalletPassData, issuerId: string = 'stampy_issuer'): GoogleLoyaltyClass {
    return {
      id: this.generateClassId(issuerId, data.cafeSlug),
      issuerName: data.cafeName,
      programName: `برنامج ولاء ${data.cafeName}`,
      programLogo: {
        sourceUri: {
          uri: data.logoUrl || 'https://memories-c9w.pages.dev/brand/stampy-logo.svg',
        },
      },
      hexBackgroundColor: data.color || '#5b2d9e',
      reviewStatus: 'APPROVED',
    };
  },

  /**
   * Builds the official Google Wallet LoyaltyObject schema for a customer.
   */
  buildLoyaltyObject(data: DigitalWalletPassData, issuerId: string = 'stampy_issuer'): GoogleLoyaltyObject {
    const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const stampUrl = `https://memories-542.pages.dev/c/${data.cafeSlug}?action=stamp&customer=${cleanPhone}`;
    const isCompleted = data.stampedCount >= data.maxSlots;

    return {
      id: this.generateObjectId(issuerId, data.cafeSlug, data.customerPhone),
      classId: this.generateClassId(issuerId, data.cafeSlug),
      state: isCompleted ? 'COMPLETED' : 'ACTIVE',
      accountId: data.customerPhone,
      accountName: data.customerName || 'ضيف مميز',
      loyaltyPoints: {
        label: 'رصيد الأختام',
        balance: {
          string: `${data.stampedCount}/${data.maxSlots}`,
        },
      },
      barcode: {
        type: 'QR_CODE',
        value: stampUrl,
        alternateText: 'امسح عند الكاشير للختم الفوري',
      },
      messages: [
        {
          header: isCompleted ? 'المكافأة جاهزة للاستلام! 🎁' : 'أختامك في أمان ⚡',
          body: isCompleted
            ? `تفضل بزيارتنا في ${data.cafeName} لاستلام: ${data.giftTitle || 'مكافأتك المجانية'}`
            : `باقٍ لك ${data.maxSlots - data.stampedCount} أختام فقط لفتح مكافأتك القادمة.`,
        },
      ],
    };
  },

  /**
   * Generates the "Save to Google Wallet" web link with signed JWT / direct URL.
   */
  generateSaveUrl(data: DigitalWalletPassData, issuerId: string = 'stampy_issuer'): string {
    const cleanPhone = (data.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    return `https://pay.google.com/gp/v/save?classId=${encodeURIComponent(
      this.generateClassId(issuerId, data.cafeSlug)
    )}&objectId=${encodeURIComponent(
      this.generateObjectId(issuerId, data.cafeSlug, cleanPhone)
    )}`;
  },
};
