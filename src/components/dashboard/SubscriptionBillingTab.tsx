'use client';

import React from 'react';
import {
  SubscriptionBillingTabProps,
  useSubscriptionBilling,
  SubscriptionBillingContent,
} from '@/features/billing';

export type { SubscriptionBillingTabProps };

export function SubscriptionBillingTab({ cafeSlug }: SubscriptionBillingTabProps) {
  const vm = useSubscriptionBilling(cafeSlug);

  return <SubscriptionBillingContent vm={vm} cafeSlug={cafeSlug} />;
}
