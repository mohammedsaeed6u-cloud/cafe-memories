'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WallClient } from '@/components/wall/WallClient';

function WallContentWithParams() {
  const searchParams = useSearchParams();
  const screenId = searchParams.get('screen') || searchParams.get('id') || 'screen-1';

  return <WallClient screenId={screenId} />;
}

export default function WallDefaultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D071A] flex items-center justify-center font-sans text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-[#F0456A] border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-[#8E879E]">جاري تشغيل شاشة الصالة الذكية 4K...</span>
          </div>
        </div>
      }
    >
      <WallContentWithParams />
    </Suspense>
  );
}
