import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col items-center selection:bg-amber-500/30 selection:text-amber-900">
      <div className="w-full max-w-xl min-h-screen flex flex-col relative px-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}
