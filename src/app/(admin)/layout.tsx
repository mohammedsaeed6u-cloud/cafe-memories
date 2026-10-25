import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import { requireSuperAdminPage } from '@/lib/server/page-auth';

export const metadata: Metadata = {
  title: 'stampy. • بوابة الإدارة المركزية (Super Admin)',
  description: 'إدارة الفروع المركزية، الاشتراكات المتكررة، ومؤشرات الـ SaaS.',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdminPage();

  return (
    <div className="flex min-h-screen bg-[#FAF5EB] text-[#3D2314]">
      <aside className="w-64 bg-white border-l border-[#EADDC4] text-[#3D2314] flex-shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFAB56] to-[#3D2314] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#EADDC4] shrink-0">
              <MemoriesArchIcon size={20} color="#FAF5EB" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[#3D2314] font-serif">
                System Admin
              </h2>
              <span className="text-[10px] font-mono text-[#63574D]">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#FAF5EB] text-[#3D2314] border border-[#DFAB56]/40 text-xs font-bold transition"
            >
              <span>لوحة الإدارة المركزية</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#63574D] hover:text-[#3D2314] hover:bg-[#FAF5EB]/50 text-xs font-medium transition"
            >
              <span>لوحة التاجر</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-[#EADDC4] text-[11px] text-[#63574D]">
          <span>Stampy Platform v2.4</span>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 bg-[#FAF5EB] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
