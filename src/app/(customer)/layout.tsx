import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#FAF8F5] relative shadow-xl border-x border-stone-200/80">
        {children}
      </div>
    </div>
  );
}
