'use client';

import { useEffect, useState } from 'react';
import { CustomerCustomizationData, CUSTOMER_THEMES } from './customer-themes';
import { reportIgnoredError } from '@/lib/services/diagnostics';

/**
 * Per-customer card customization (theme, nickname, badge, stamp emoji),
 * persisted to localStorage per cafe+phone and reported through diagnostics
 * when storage fails. Extracted from CustomerClient to keep the client shell
 * focused on composition.
 */
export function useCustomerCardCustomization(cafeSlug: string, customerPhone: string) {
  const [customization, setCustomization] = useState<CustomerCustomizationData>({
    themeId: CUSTOMER_THEMES[0].id,
    customerName: '',
    badgeTitle: 'عضو مميز',
    stampEmoji: '⭐',
  });

  // Load persisted customization for this cafe+phone session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(
        `memories_card_customization_${cafeSlug}_${customerPhone || 'guest'}`
      );
      if (raw) setCustomization({ ...JSON.parse(raw) });
    } catch (e) {
      reportIgnoredError('customer/customization-load', e);
    }
  }, [cafeSlug, customerPhone]);

  const handleCustomizationChange = (patch: Partial<CustomerCustomizationData>) => {
    setCustomization((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(
          `memories_card_customization_${cafeSlug}_${customerPhone || 'guest'}`,
          JSON.stringify(next)
        );
      } catch (e) {
        reportIgnoredError('customer/customization-save', e);
      }
      return next;
    });
  };

  return { customization, handleCustomizationChange };
}
