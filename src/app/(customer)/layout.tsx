import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center selection:bg-[#DD0200] selection:text-white relative overflow-x-hidden">
      {/* Atelier Nostalgia Ambient Glows */}
      <div className="fixed top-0 left-0 w-[550px] h-[500px] bg-gradient-to-br from-[#55100D]/20 via-[#1A0706]/30 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#DD0200]/10 via-[#55100D]/15 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="w-full max-w-xl min-h-screen flex flex-col relative z-10 px-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}
