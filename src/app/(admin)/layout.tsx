import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#141313] text-[#e6e1e1]">
      <aside className="w-64 bg-[#0E0D0D] border-l border-white/10 text-[#FBF9F5] flex-shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/10">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[#FBF9F5] font-serif">
                System Admin
              </h2>
              <span className="text-[10px] font-mono text-[#A19E9B]">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#55100D]/40 text-[#FBF9F5] border border-[#DD0200]/30 text-xs font-bold transition"
            >
              <span>لوحة الإدارة المركزية</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-white/[0.04] text-xs font-medium transition"
            >
              <span>لوحة التاجر</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-white/10 text-[11px] text-[#A19E9B]">
          <span>Memories Platform v2.4</span>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 bg-[#141313] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
