import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141313] text-[#FBF9F5] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#c92a54] selection:text-white">
      {children}
    </div>
  );
}
