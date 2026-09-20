export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:block">
        <div className="p-4">
          <h2 className="text-2xl font-bold">Café Memories</h2>
        </div>
        <nav className="mt-8">
          <ul className="space-y-2 px-4">
            <li><span className="block py-2 text-gray-300 hover:text-white cursor-pointer">Dashboard</span></li>
            <li><span className="block py-2 text-gray-300 hover:text-white cursor-pointer">Branches</span></li>
            <li><span className="block py-2 text-gray-300 hover:text-white cursor-pointer">Memories</span></li>
            <li><span className="block py-2 text-gray-300 hover:text-white cursor-pointer">Settings</span></li>
          </ul>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold">Merchant Portal</h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
