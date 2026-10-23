'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerClient } from '@/components/customer/CustomerClient';

function CustomerQueryWrapper() {
  const searchParams = useSearchParams();
  const cafeSlug = searchParams.get('cafe') || searchParams.get('slug') || 'stampy';

  return <CustomerClient cafeSlug={cafeSlug} />;
}

export default function CustomerIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF5EB] flex items-center justify-center font-sans">
          <div className="w-10 h-10 rounded-full border-3 border-[#DFAB56] border-t-transparent animate-spin" />
        </div>
      }
    >
      <CustomerQueryWrapper />
    </Suspense>
  );
}
