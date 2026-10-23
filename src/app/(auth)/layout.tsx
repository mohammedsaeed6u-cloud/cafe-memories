import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'stampy. • تسجيل الدخول وبوابة المنشأة',
  description: 'بوابة أصحاب الأنشطة التجارية لإدارة كروت الولاء، شاشات الصالة، واستوديو الذكريات التفاعلي.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {children}
    </div>
  );
}
