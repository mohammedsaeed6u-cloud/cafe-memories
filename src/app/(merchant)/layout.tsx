import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'memories studio • لوحة تحكم المنشأة',
  description: 'لوحة إدارة استوديو الذكريات، محطة الطباعة الفورية، شاشات الصالة وكروت الولاء الرقمية.',
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] font-sans relative selection:bg-[#DD0200] selection:text-white">
      {children}
    </div>
  );
}
