export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-xl relative">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-10 px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg">Café Memories</div>
      </header>
      <main className="flex-1 relative overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
