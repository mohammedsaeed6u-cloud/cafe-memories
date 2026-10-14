import Link from 'next/link';

export default function HomePage() {
  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5]">
    <header className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 px-6 py-6 border-b border-white/10">
      <Link href="/" className="font-bold text-lg">✦ Café Memories</Link>
      <nav className="flex gap-5 text-sm"><Link href="#how-it-works" className="text-stone-300 hover:text-white">كيف تعمل؟</Link>
        <Link href="/login" className="text-red-300 hover:text-white">دخول المنشأة</Link></nav>
    </header>
    <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 space-y-8">
      <p className="text-red-400 text-xs font-bold tracking-widest">ذكريات تحفظ الخصوصية · ولاء تحسبه الزيارة الحقيقية</p>
      <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-3xl">صورة من اللحظة.<br /><span className="text-[#dd0200]">سبب جديد للعودة.</span></h1>
      <p className="text-lg text-stone-400 leading-relaxed max-w-xl">سجّل منشأتك، وامنح ضيوفك مساحة خاصة لصورهم، وبرنامج ولاء يعتمد على زيارات يؤكدها فريقك. لا تظهر أي صورة على شاشة الصالة إلا بعد موافقة صاحبها ومراجعة المنشأة.</p>
      <div className="flex flex-wrap gap-3"><Link href="/login?mode=signup" className="bg-[#dd0200] rounded-lg px-6 py-3 font-bold hover:bg-red-700">ابدأ بإنشاء حساب منشأتك</Link>
        <Link href="#how-it-works" className="border border-white/20 rounded-lg px-6 py-3 hover:bg-white/5">اكتشف التجربة</Link></div>
      <p className="text-xs text-stone-500">تحتاج هذه النسخة إلى خادم Next.js وSupabase مهيّأ. ميزتا Wallet والطباعة والاشتراكات المدفوعة غير مفعّلتين.</p>
    </section>
    <section id="how-it-works" className="border-t border-white/10 bg-[#1c1a1a] py-20 px-6">
      <div className="max-w-5xl mx-auto"><h2 className="text-3xl font-bold mb-9">تجربة واضحة من البداية للنهاية</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['١ · QR للفرع', 'تنشئ المنشأة رابط QR من لوحة الإدارة؛ يرتبط بالفرع الصحيح وليس ببيانات المتصفح.'],
            ['٢ · ذكرى بإذن الضيف', 'يرفع الضيف صورته بحساب مؤقت خاص، ويختار بنفسه السماح بعرضها أو الاحتفاظ بها خاصة.'],
            ['٣ · زيارة موثّقة', 'يؤكد الموظف الزيارة بعد الشراء؛ يحتسب النظام المكافآت ويمنع الصرف المكرر.'],
          ].map(([title, body]) => <article key={title} className="bg-[#242121] border border-white/10 rounded-xl p-6 space-y-3">
            <h3 className="font-bold text-xl">{title}</h3><p className="text-stone-400 text-sm leading-7">{body}</p>
          </article>)}
        </div>
      </div>
    </section>
    <section className="max-w-5xl mx-auto px-6 py-20 space-y-4"><h2 className="text-3xl font-bold">الشاشة لا تعرض إلا ما سُمح به</h2>
      <p className="text-stone-400 max-w-2xl leading-7">الشاشة تحتاج إلى رمز اقتران قصير الصلاحية، وتعرض فقط صور فرعها الموافق عليها. يستطيع الضيف سحب موافقته، وتُعاد مراجعة الإذن عند طلب كل صورة.</p>
      <Link href="/wall" className="inline-block text-red-300 underline">إقران شاشة صالة</Link></section>
    <footer className="border-t border-white/10 px-6 py-8 text-sm text-stone-400 flex justify-between flex-wrap gap-3 max-w-6xl mx-auto">
      <span>© Café Memories</span><div className="flex gap-5"><Link href="/privacy" className="hover:text-white">الخصوصية</Link><Link href="/terms" className="hover:text-white">الشروط</Link></div>
    </footer>
  </main>;
}
