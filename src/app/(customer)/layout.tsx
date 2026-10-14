import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] flex flex-col items-center selection:bg-[#DFAB56] selection:text-white relative overflow-x-hidden font-sans">
      {/* Warm Ambient Stationery Glows (Hardware Accelerated for Mobile Safari) */}
      <div className="fixed top-0 left-0 w-[550px] h-[500px] bg-gradient-to-br from-[#EADDC4]/30 via-[#F5ECDC]/30 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#DFAB56]/10 via-[#EADDC4]/20 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />

      <div className="w-full max-w-xl min-h-screen flex flex-col relative z-10 px-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}
