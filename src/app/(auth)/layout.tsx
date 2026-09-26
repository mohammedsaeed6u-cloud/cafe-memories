import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {children}
    </div>
  );
}
