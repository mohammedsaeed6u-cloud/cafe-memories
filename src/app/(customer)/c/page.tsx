'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { CustomerClient } from '@/components/customer/CustomerClient';

function CustomerQueryWrapper() {
  const searchParams = useSearchParams();
  const cafeSlug = searchParams.get('cafe') || searchParams.get('slug') || '';

  if (!cafeSlug) {
    return (
      <div className="min-h-screen bg-[#FAF5EB] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-sm space-y-3">
          <h1 className="text-lg font-bold text-[#3D2314]">امسح رمز الطاولة</h1>
          <p className="text-sm text-[#3D2314]/70">
            هذا الرابط يحتاج إلى رمز المنشأة. امسح رمز QR الموجود على طاولتك أو عند الكاونتر
            لبدء تجربة الذكريات.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3D2314]/20 bg-white px-3 py-2 text-xs font-bold text-[#3D2314] hover:border-[#DFAB56]"
          >
            <MapPin className="h-3.5 w-3.5" />
            اكتشف أماكن قريبة
          </Link>
        </div>
      </div>
    );
  }

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
