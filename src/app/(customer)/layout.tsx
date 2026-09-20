import React from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-stone-950 relative shadow-2xl">
        {children}
      </div>
    </div>
  );
}
