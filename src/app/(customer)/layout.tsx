import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'stampy. • استوديو تصوير الذكريات والولاء',
  description: 'التقاط شريط الصور الفوري، تزيين الكارت بالملصقات، وحفظ كارت الولاء في Apple Wallet.',
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] flex flex-col items-center selection:bg-[#DFAB56] selection:text-[#3D2314] relative overflow-x-hidden">
      {/* استامبي • Stampy Ambient Warm Lighting */}
      <div className="fixed top-0 left-0 w-[550px] h-[500px] bg-gradient-to-br from-[#DFAB56]/15 via-[#EADDC4]/30 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#3D2314]/8 via-[#DFAB56]/10 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="w-full max-w-xl min-h-screen flex flex-col relative z-10 px-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}
