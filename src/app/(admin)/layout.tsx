import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#141313] text-[#FBF9F5] font-sans">
      <aside className="w-64 bg-[#141212] border-l border-[rgba(255,255,255,0.1)] text-[#FBF9F5] flex-shrink-0 flex flex-col justify-between shadow-xs">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#FBF9F5] text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs border border-stone-800">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-[#FBF9F5]">
                System Admin
              </h2>
              <span className="text-[10px] font-mono text-[#c92a54] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] text-white text-xs font-bold transition shadow-xs"
            >
              <span>لوحة الإدارة المركزية</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-stone-600 hover:text-[#FBF9F5] hover:bg-[#0B0A0A] text-xs font-bold transition"
            >
              <span>لوحة التاجر والـ CRM</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-[rgba(255,255,255,0.1)] text-[11px] text-stone-400 font-mono">
          <span>Stampy Platform v3.0 SaaS</span>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 bg-[#141313] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
