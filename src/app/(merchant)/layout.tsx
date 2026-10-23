import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'stampy. • لوحة تحكم المنشأة',
  description: 'لوحة إدارة استوديو الذكريات، محطة الطباعة الفورية، شاشات الصالة وكروت الولاء الرقمية.',
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] font-sans relative selection:bg-[#DFAB56] selection:text-white">
      {children}
    </div>
  );
}
