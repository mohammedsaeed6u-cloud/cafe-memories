import Link from 'next/link';

/** A missing tenant or screen must remain a real 404, never render demo data. */
export default function NotFoundPage() {
  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] flex items-center justify-center p-6">
    <div className="text-center max-w-md space-y-5"><span className="text-red-400 text-sm font-bold">404 · CAFÉ MEMORIES</span>
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-stone-400">تحقق من رابط المنشأة أو رمز الفرع، أو اطلب رابطًا جديدًا من فريق المكان.</p>
      <Link href="/" className="inline-block rounded-lg bg-[#dd0200] px-5 py-3 font-bold">العودة للرئيسية</Link>
    </div>
  </main>;
}
