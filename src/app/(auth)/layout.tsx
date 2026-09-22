import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex items-center justify-center p-4 sm:p-6 font-cairo">
      {children}
    </div>
  );
}
