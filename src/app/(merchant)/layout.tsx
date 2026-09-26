import React from 'react';

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
