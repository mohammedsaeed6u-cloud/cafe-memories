import Link from "next/link";

export default function TermsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-12 text-ink sm:px-8 sm:py-18"
    >
      <article className="mx-auto max-w-3xl space-y-6 leading-8">
        <Link
          href="/"
          className="text-sm font-bold text-rust underline underline-offset-4"
        >
          ← الرئيسية
        </Link>
        <header>
          <p className="text-sm text-ink/55">محدّثة: 14 أكتوبر 2026</p>
          <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
            شروط الاستخدام
          </h1>
        </header>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">حسابات المنشآت</h2>
          <p className="text-sm leading-8 text-ink/70">
            تستخدم المنشأة حساب Supabase Auth وبريدًا إلكترونيًا. على أعضاء
            الفريق استخدام حسابات وصلاحيات مخصصة؛ لا تشارك بيانات الدخول. لا
            تُعد رموز PIN المحلية وسيلة اعتماد.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">حساب الضيف</h2>
          <p className="text-sm leading-8 text-ink/70">
            يمكنك الدخول بحساب Google أو استخدام جلسة ضيف مؤقتة. اربط جلسة الضيف
            بـ Google قبل فقدان المتصفح حتى لا تفقد إمكانية الوصول للذكريات
            والرصيد؛ لا نربط حساب Google مستخدمًا بحساب ضيف آخر تلقائيًا. رقم
            التواصل في الإعدادات اختياري وغير موثّق ولا يمنح زيارة.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">الزيارات والمكافآت</h2>
          <p className="text-sm leading-8 text-ink/70">
            رفع صورة لا يمنح زيارة موثقة تلقائيًا. يؤكد موظف المنشأة الشراء
            والزيارة؛ تعتمد المكافآت على الزيارات الموثقة وقواعد المنشأة. قد
            تمنع فترات التهدئة إضافة زيارات متكررة في مدة قصيرة.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">كارت الذكريات</h2>
          <p className="text-sm leading-8 text-ink/70">
            بعد ختم يؤكده الموظف، تصوير الزيارة اختياري وخاص في الأصل ولا يمنح
            ختمًا إضافيًا. عند اكتمال الأختام، يحفظ حساب الضيف كارتًا يضم صور
            الزيارات التي رفعها وأماكن فارغة لما لم يصوّره، مع المكافأة الموعودة.
            يمكن لصاحب الحساب حفظه PDF أو إرساله بنفسه للطباعة في الفرع عبر نافذة
            المتصفح؛ لا نُرسل صور العملاء إلى طابعة تلقائيًا.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">الصور وشاشة الصالة</h2>
          <p className="text-sm leading-8 text-ink/70">
            لا ترفع صورًا دون إذن الأشخاص الظاهرين فيها، أو مواد مسيئة أو تنتهك
            الحقوق. تتطلب الشاشة اقترانًا وموافقة الضيف ومراجعة الفريق. يحق
            للضيف سحب موافقته على العرض.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">بطاقة Wallet الاختيارية</h2>
          <p className="text-sm leading-8 text-ink/70">
            لا نصدر بطاقة Wallet بدون موافقتك وربط مزوّد WalletWallet الفعلي.
            اختيار رسائل الحملات وقرب الفروع مستقل؛ لا يثبت صدور رابط الإضافة
            أنك ثبتّ البطاقة أو أن هاتفك عرض إشعارًا. مشاركة البطاقة أو حذفها من
            الجهاز تحت تحكمك؛ إلغاء الكارت عند المزوّد يعتمد على استجابة الخدمة،
            وأي نتيجة غير مؤكدة تستوجب إزالة البطاقة من الجهاز ومراجعة الدعم.
          </p>
        </section>
        <section className="paper-card rounded-[1.5rem] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">حدود النسخة الحالية</h2>
          <p className="text-sm leading-8 text-ink/70">
            تتطلب الخدمة خادم Next.js وتهيئة Supabase وترحيل قاعدة البيانات. لا
            توجد فوترة فعلية أو شهادات Apple/Google خاصة بنا أو نظام طباعة تجاري
            متصل في هذه النسخة. إصدار Wallet الموقع يكون بواسطة WalletWallet عند
            تفعيله، ويجب اختبار التشغيل وخصوصية البيانات قبل النشر العام.
          </p>
        </section>
        <p className="text-xs leading-7 text-ink/50">
          وثيقة توضيحية للمنتج الحالي؛ يلزم اعتماد شروط قانونية نهائية قبل
          الاستخدام التجاري.
        </p>
      </article>
    </main>
  );
}
