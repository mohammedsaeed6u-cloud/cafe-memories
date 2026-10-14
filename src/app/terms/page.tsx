import Link from 'next/link';

export default function TermsPage() {
  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] px-6 py-14">
    <article className="max-w-3xl mx-auto space-y-8 leading-8"><Link href="/" className="text-red-300">← الرئيسية</Link>
      <header><p className="text-stone-400 text-sm">محدّثة: 14 أكتوبر 2026</p><h1 className="text-4xl font-bold mt-2">شروط الاستخدام</h1></header>
      <section><h2 className="text-xl font-bold mb-2">حسابات المنشآت</h2><p className="text-stone-300">تستخدم المنشأة حساب Supabase Auth وبريدًا إلكترونيًا. على أعضاء الفريق استخدام حسابات وصلاحيات مخصصة؛ لا تشارك بيانات الدخول. لا تُعد رموز PIN المحلية وسيلة اعتماد.</p></section>
      <section><h2 className="text-xl font-bold mb-2">حساب الضيف</h2><p className="text-stone-300">يمكنك الدخول بحساب Google أو استخدام جلسة ضيف مؤقتة. اربط جلسة الضيف بـ Google قبل فقدان المتصفح حتى لا تفقد إمكانية الوصول للذكريات والرصيد؛ لا نربط حساب Google مستخدمًا بحساب ضيف آخر تلقائيًا. رقم التواصل في الإعدادات اختياري وغير موثّق ولا يمنح زيارة.</p></section>
      <section><h2 className="text-xl font-bold mb-2">الزيارات والمكافآت</h2><p className="text-stone-300">رفع صورة لا يمنح زيارة موثقة تلقائيًا. يؤكد موظف المنشأة الشراء والزيارة؛ تعتمد المكافآت على الزيارات الموثقة وقواعد المنشأة. قد تمنع فترات التهدئة إضافة زيارات متكررة في مدة قصيرة.</p></section>
      <section><h2 className="text-xl font-bold mb-2">الصور وشاشة الصالة</h2><p className="text-stone-300">لا ترفع صورًا دون إذن الأشخاص الظاهرين فيها، أو مواد مسيئة أو تنتهك الحقوق. تتطلب الشاشة اقترانًا وموافقة الضيف ومراجعة الفريق. يحق للضيف سحب موافقته على العرض.</p></section>
      <section><h2 className="text-xl font-bold mb-2">حدود النسخة الحالية</h2><p className="text-stone-300">تتطلب الخدمة خادم Next.js وتهيئة Supabase وترحيل قاعدة البيانات. لا توجد فوترة فعلية أو إصدار Apple Wallet موقّع أو نظام طباعة تجاري متصل في هذه النسخة. يجب اختبار التشغيل وخصوصية البيانات قبل النشر العام.</p></section>
      <p className="text-sm text-stone-400">وثيقة توضيحية للمنتج الحالي؛ يلزم اعتماد شروط قانونية نهائية قبل الاستخدام التجاري.</p>
    </article>
  </main>;
}
