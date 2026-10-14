'use client';

import React from 'react';
import {
  CustomerClientProps,
  useCustomerExperience,
  CustomerExperienceContent,
} from '@/features/customer-experience';

export type { CustomerClientProps };

export function CustomerClient({ cafeSlug: propCafeSlug }: { cafeSlug: string }) {
  const cx = useCustomerExperience(propCafeSlug);

  return <CustomerExperienceContent cx={cx} />;
}
