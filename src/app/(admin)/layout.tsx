export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-red-50">
      <aside className="w-64 bg-red-900 text-white flex-shrink-0">
        <div className="p-4">
          <h2 className="text-2xl font-bold">System Admin</h2>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
