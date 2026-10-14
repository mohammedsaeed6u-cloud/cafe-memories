import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    symbol: "⌁",
    title: "الضيف يفتح رابط الفرع",
    detail:
      "رمز QR يفتح صفحة المكان مباشرةً على أي موبايل. لا تحميل تطبيق، ولا كارت ورقي ممكن يضيع.",
  },
  {
    number: "02",
    symbol: "✳",
    title: "الزيارة تتأكد فعلًا",
    detail:
      "الموظف يؤكد الشراء في الفرع؛ فتح الرابط أو رفع صورة وحدهما لا يمنحان ختمًا.",
  },
  {
    number: "03",
    symbol: "✦",
    title: "الرجوع له معنى",
    detail:
      "الضيف يرى تقدّمه ومكافأته في بطاقة واحدة، ويحتفظ بذكرياته وصوره بإذنه.",
  },
];

export default function HomePage() {
  return (
    <main dir="rtl" className="overflow-hidden bg-paper text-ink">
      <header className="relative z-10 border-b border-ink/10 bg-paper/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Link
            href="/"
            aria-label="Café Memories - الرئيسية"
            className="flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-2xl text-[#f3c178]"
            >
              ✳
            </span>
            <span className="text-lg font-bold tracking-tight" dir="ltr">
              café<span className="text-rust">memories</span>
            </span>
          </Link>
          <nav
            aria-label="القائمة الرئيسية"
            className="hidden items-center gap-8 text-sm font-bold text-ink/70 md:flex"
          >
            <a href="#how" className="hover:text-rust">
              كيف بتشتغل؟
            </a>
            <a href="#experience" className="hover:text-rust">
              التجربة
            </a>
            <Link href="/privacy" className="hover:text-rust">
              الخصوصية
            </Link>
          </nav>
          <Link
            href="/login"
            className="rounded-full border border-forest/20 px-4 py-2 text-sm font-bold text-forest transition hover:bg-forest hover:text-white sm:px-6"
          >
            دخول المنشأة <span aria-hidden="true">↖</span>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-18 pt-12 md:px-10 md:pb-28 md:pt-20 lg:grid-cols-[1fr_1.06fr] lg:gap-14">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/70 px-4 py-2 text-forest">
            <span className="text-rust">✳</span> ذكريات تستحق العودة
          </p>
          <h1 className="display-heading text-[clamp(3.1rem,6vw,6rem)]">
            كل زيارة
            <br />
            تسيب{" "}
            <span className="relative inline-block text-rust">
              أثرًا
              <span
                aria-hidden="true"
                className="absolute -bottom-2 right-0 h-2 w-full rounded-full bg-[#edbe82]/70"
              />
            </span>
            <br />
            يخلّيهم يرجعوا.
          </h1>
          <p className="mt-8 max-w-lg text-base leading-9 text-ink/65 md:text-lg">
            برنامج ولاء بسيط للمقاهي: بطاقة تتقدّم مع كل زيارة يؤكدها فريقك،
            ومساحة يحفظ فيها ضيفك اللحظات اللي يحب يفتكرها. شغل حقيقي، مش أختام
            من مجرد مسح رابط.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/login?mode=signup" className="action-primary">
              ابدأ بمنشأتك <span aria-hidden="true">↖</span>
            </Link>
            <a href="#how" className="action-secondary">
              شوف الرحلة <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="mt-7 flex items-center gap-2 text-xs font-bold text-ink/50">
            <span className="text-lg text-rust" aria-hidden="true">
              ✦
            </span>{" "}
            من غير تنزيل تطبيق للضيف · الصور خاصة إلا بموافقته
          </p>
        </div>
        <div className="relative min-h-[430px] sm:min-h-[560px]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-[#382a20] shadow-[0_35px_85px_-35px_#182c2570] sm:rounded-[2.5rem]">
            <Image
              src="/cafe-counter.webp"
              alt="ضيف يستلم قهوته في أحد المقاهي"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172b23]/55 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 left-6 flex items-center justify-between gap-3 text-white sm:bottom-9 sm:right-9 sm:left-9">
              <p className="max-w-[13rem] text-lg font-bold leading-7 sm:text-xl">
                من أول فنجان… لحد ما يبقوا من أهل المكان.
              </p>
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/60 text-2xl"
              >
                ✳
              </span>
            </div>
          </div>
          <div
            className="paper-card absolute -bottom-8 -left-2 w-[min(80%,260px)] rotate-[-5deg] rounded-[1.5rem] p-5 shadow-xl sm:-left-7 sm:p-6"
            aria-label="مثال توضيحي لشكل بطاقة الولاء"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-rust">بطاقة ولاء</p>
                <p className="mt-1 font-bold">المكان اللي بتحبه</p>
              </div>
              <span aria-hidden="true" className="text-2xl text-rust">
                ✳
              </span>
            </div>
            <div aria-hidden="true" className="mt-7 grid grid-cols-6 gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className="grid aspect-square place-items-center rounded-full border border-dashed border-forest/35 text-lg text-forest/25"
                >
                  ✳
                </span>
              ))}
            </div>
            <p className="mt-5 border-t border-ink/10 pt-3 text-[11px] text-ink/55">
              الشكل للتوضيح · الزيارات تظهر بعد تأكيدها
            </p>
          </div>
        </div>
      </section>

      <div className="border-y border-forest/15 bg-forest px-5 py-5 text-[#faf5e9]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center text-sm font-bold md:justify-between md:px-5">
          <span>✳ &nbsp; زيارة موثّقة</span>
          <span>✳ &nbsp; بطاقة واحدة للمكان</span>
          <span>✳ &nbsp; مكافأة واضحة</span>
          <span>✳ &nbsp; ذكرى بإذن صاحبها</span>
        </div>
      </div>

      <section
        id="how"
        className="mx-auto max-w-7xl px-5 py-22 md:px-10 md:py-30"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-rust">بسيطة من أول مرة</p>
            <h2 className="display-heading mt-4 max-w-xl text-4xl sm:text-5xl">
              ثلاث خطوات.
              <br />
              وعلاقة بتفضل.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-8 text-ink/60">
            أخذنا بساطة بطاقة الختم الورقية، وحطّينا وراها تحققًا حقيقيًا يحفظ
            حق الضيف والمنشأة.
          </p>
        </div>
        <div className="mt-11 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="paper-card group relative flex min-h-64 flex-col rounded-[1.75rem] p-7 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-rust">
                  {step.number} / 03
                </span>
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-sage text-2xl text-forest"
                >
                  {step.symbol}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/60">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="experience"
        className="bg-[#e8eee4] px-5 py-22 md:px-10 md:py-28"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative rounded-[2rem] bg-forest p-6 text-white shadow-xl sm:p-9">
            <div className="flex items-center justify-between border-b border-white/15 pb-5">
              <div>
                <p className="eyebrow text-[#efc68e]">تجربة العميل</p>
                <p className="mt-1 text-lg font-bold">بطاقتك دايمًا معاك</p>
              </div>
              <span aria-hidden="true" className="text-3xl text-[#efc68e]">
                ✳
              </span>
            </div>
            <div
              className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6"
              aria-hidden="true"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="grid aspect-square place-items-center rounded-full border border-dashed border-[#e6d7ae]/60 text-2xl text-[#e6d7ae]/50"
                >
                  ✳
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 p-5">
              <p className="text-sm font-bold">
                زيارتك الجاية تقرّبك من مكافأتك.
              </p>
              <p className="mt-1 text-xs leading-6 text-white/60">
                العدد والمكافأة يتحددوا من إعدادات المنشأة الفعلية.
              </p>
            </div>
            <p className="mt-5 text-[11px] text-white/50">
              تصوّر توضيحي للبطاقة · لا توجد زيارات تجريبية
            </p>
          </div>
          <div>
            <p className="eyebrow text-rust">للضيف ولصاحب المكان</p>
            <h2 className="display-heading mt-4 text-4xl sm:text-5xl">
              بطاقة يفهمها الضيف.
              <br />
              ونظام تثق فيه.
            </h2>
            <p className="mt-6 text-base leading-9 text-ink/65">
              الضيف يتابع رصيده ومكافآته الحقيقية في صفحة واضحة. صاحب المكان
              يشوف الزيارات والصور بانتظار المراجعة ويدير فروعه من مكان واحد.
              ولا زيارة تتحسب من مجرد فتح QR.
            </p>
            <div className="mt-7 space-y-4 text-sm font-bold">
              <p className="flex gap-3">
                <span className="text-rust">✳</span> كل الفروع تشارك نفس رصيد
                العلامة.
              </p>
              <p className="flex gap-3">
                <span className="text-rust">✳</span> الموظف يؤكد الشراء قبل
                الختم.
              </p>
              <p className="flex gap-3">
                <span className="text-rust">✳</span> الصورة خاصة ما لم يوافق
                الضيف على عرضها.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#b54735] px-7 py-12 text-white sm:px-12 md:px-18 md:py-16">
          <span
            aria-hidden="true"
            className="absolute -top-30 left-10 text-[24rem] leading-none text-white/8"
          >
            ✳
          </span>
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="eyebrow text-white/75">جاهز تبدأ؟</p>
              <h2 className="display-heading mt-3 max-w-xl text-3xl sm:text-5xl">
                خلّي كل زيارة بداية لحكاية جديدة.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-8 text-white/80">
                أنشئ حساب منشأتك، واضبط مكافأة تناسب ضيوفك، وابدأ رحلتهم مع كل
                زيارة مؤكدة في الفرع. من غير حسابات أو معاملات وهمية.
              </p>
            </div>
            <Link
              href="/login?mode=signup"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-forest transition hover:bg-[#f1eadb]"
            >
              إنشاء حساب المنشأة <span aria-hidden="true">↖</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-5 py-9 text-sm md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
          <div>
            <span className="font-bold" dir="ltr">
              ✳ café<span className="text-rust">memories</span>
            </span>
            <p className="mt-2 text-xs text-ink/55">
              الذكريات لها مكان. والزيارة لها قيمة.
            </p>
          </div>
          <div className="flex gap-6 text-xs font-bold text-ink/70">
            <Link href="/privacy" className="hover:text-rust">
              الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-rust">
              الشروط
            </Link>
            <Link href="/login" className="hover:text-rust">
              دخول المنشأة
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
