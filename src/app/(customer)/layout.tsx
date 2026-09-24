import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center selection:bg-[#DD0200] selection:text-white apple-font relative overflow-x-hidden">
      {/* Apple Luxury Ambient Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[450px] bg-gradient-to-br from-[#DD0200]/20 via-[#55100D]/12 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#D9D9D9]/10 via-[#8E8E93]/5 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="w-full max-w-xl min-h-screen flex flex-col relative z-10 px-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}
