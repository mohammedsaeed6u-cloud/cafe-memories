import Image from "next/image";
import Link from "next/link";
import { StampyLogo, StampyApertureIcon } from "@/components/brand/StampyLogo";

const journey = [
  {
    number: "01",
    title: "الزيارة الحقيقية أولًا",
    description: "الضيف يفتح رابط المكان، والموظف يؤكد الزيارة من محطته. فتح QR وحده لا يمنح ختمًا.",
  },
  {
    number: "02",
    title: "صورة تخص صاحبها",
    description: "بعد تأكيد الزيارة، يقدر الضيف يصوّر أو يرفع من هاتفه. الخطوة اختيارية والصورة خاصة إلا لو طلب عرضها بنفسه.",
  },
  {
    number: "03",
    title: "مكافأة وذكرى تبقى",
    description: "عند اكتمال الأختام، يستلم مكافأته ومعها كارت ذكريات دائم في حسابه، قابل للحفظ أو الطباعة في المكان.",
  },
];

export default function HomePage() {
  return (
    <main dir="rtl" className="overflow-hidden bg-paper text-ink">
      <a href="#content" className="sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-xl focus:bg-forest focus:p-3 focus:text-white">
        تخطّى إلى المحتوى
      </a>
      <header className="relative z-20 border-b border-forest/10 bg-paper/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-10">
          <Link href="/" aria-label="stampy. الرئيسية" className="shrink-0">
            <StampyLogo size="sm" showTagline={false} />
          </Link>
          <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-7 text-sm font-bold text-ink/75 md:flex">
            <a href="#how" className="hover:text-rust">التجربة</a>
            <a href="#keepsake" className="hover:text-rust">التذكار</a>
            <a href="#venues" className="hover:text-rust">للأماكن</a>
            <Link href="/privacy" className="hover:text-rust">الخصوصية</Link>
          </nav>
          <Link href="/login" className="rounded-full border border-forest/20 px-4 py-2 text-sm font-bold text-forest transition hover:bg-forest hover:text-white sm:px-6">
            دخول المكان <span aria-hidden="true">↖</span>
          </Link>
        </div>
      </header>

      <div id="content">
        <section className="relative border-b border-forest/10 px-5 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
          <div aria-hidden="true" className="pointer-events-none absolute -left-30 top-4 h-[35rem] w-[35rem] rounded-full bg-stampy-ochre/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-[610px]">
              <p className="eyebrow mb-7 inline-flex items-center gap-2 rounded-full border border-stampy-ochre/60 bg-white/65 px-4 py-2 text-forest">
                <StampyApertureIcon size={18} /> كل لحظة تترك أثرًا
              </p>
              <h1 className="display-heading text-[clamp(3.1rem,6vw,5.8rem)] leading-[1.16]">
                مش بس زيارة.
                <br />
                <span className="text-forest">ذكرى تفضل</span>
                <br />
                وترجّعهم.
              </h1>
              <p className="mt-8 max-w-xl text-base leading-9 text-ink/75 md:text-lg">
                stampy. تحول الزيارة المؤكدة لختم، وتسيب للضيف اختيار حفظ صورة خاصة من موبايله. مع المكافأة، يحصل على تذكار رقمي ومطبوع يحمل اسم مكانك وذكرياته.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/login?mode=signup" className="action-primary">ابدأ بمكانك <span aria-hidden="true">↖</span></Link>
                <a href="#how" className="action-secondary">شوف الرحلة <span aria-hidden="true">↓</span></a>
              </div>
              <p className="mt-7 text-xs font-bold leading-6 text-ink/65">
                بدون تطبيق للضيف · لا ختم قبل تأكيد الفريق · الصور لا تُعرض بدون إذن
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-[610px]">
              <div className="relative overflow-hidden rounded-[3rem] border border-[#b7853b] bg-stampy-ochre p-5 shadow-[0_35px_100px_-50px_#45121588] sm:p-9">
                <div className="absolute inset-x-0 top-[42%] h-[7rem] bg-[linear-gradient(to_bottom,#3D2314_0_20%,#AC3E25_20%_40%,#EBA935_40%_60%,#B18944_60%_80%,#337482_80%_100%)] opacity-85" aria-hidden="true" />
                <div className="relative flex min-h-[350px] items-center justify-center rounded-[2.3rem] border border-[#682025]/25 bg-[#FAF5EB]/95 p-6 shadow-[0_15px_55px_-30px_#451215] sm:min-h-[410px]">
                  <Image src="/brand/01-stampy-hero-logo.svg" alt="شعار stampy. على تذكرة فيلم بعدسة سداسية وخطوط ملونة" width={600} height={420} priority className="w-full max-w-[500px]" />
                </div>
                <p className="relative mt-5 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#3D2314]" dir="ltr">Every moment is a stamp in time.</p>
              </div>
              <div className="absolute -bottom-7 -right-2 max-w-[215px] rotate-[4deg] rounded-2xl border border-forest/15 bg-paper px-4 py-3 shadow-xl sm:-right-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-rust" dir="ltr">YOUR KEEPSAKE</p>
                <p className="mt-1 text-sm font-bold leading-6">صورة تختارها أنت، وكارت يبقى معاك.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="border-b border-[#451215] bg-forest px-5 py-5 text-paper">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-12 gap-y-3 text-center text-sm font-bold md:justify-between">
            <span>زيارة موثقة</span><span>صورة باختيار الضيف</span><span>مكافأة ملموسة</span><span>ذكرى تدوم</span>
          </div>
        </div>

        <section id="how" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-rust">الرحلة / 01—03</p>
              <h2 className="display-heading mt-3 max-w-2xl text-4xl sm:text-5xl">من لحظة عابرة،<br />لحكاية تفضل.</h2>
            </div>
            <p className="max-w-md text-sm leading-8 text-ink/65">تجربة خفيفة لكل الأماكن التي تجمع الناس. الزيارة والخصوصية والمكافأة تتعامل معها أنظمة حقيقية، لا بيانات عرض وهمية.</p>
          </div>
          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {journey.map((step) => (
              <article key={step.number} className="relative flex min-h-[255px] flex-col rounded-[1.75rem] border border-[#D5C0A8] bg-white p-7 shadow-[0_14px_40px_-32px_#45121588]">
                <div className="flex items-center justify-between border-b border-dashed border-[#D5C0A8] pb-4">
                  <span className="font-mono text-xs font-bold tracking-widest text-rust" dir="ltr">STAMP {step.number}</span>
                  <StampyApertureIcon size={27} />
                </div>
                <h3 className="mt-7 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-8 text-ink/65">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="keepsake" className="bg-[#EADDC4] px-5 py-24 md:px-10 md:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative rounded-[2.5rem] bg-[#3D2314] p-8 text-paper shadow-[0_25px_80px_-35px_#451215] sm:p-12">
              <div className="flex items-center justify-between border-b border-white/20 pb-5">
                <span className="font-mono text-xs font-bold tracking-[0.15em] text-stampy-ochre" dir="ltr">STAMPY. × YOUR VENUE</span>
                <StampyApertureIcon size={32} color="#DFAB56" strokeColor="#3D2314" />
              </div>
              <div className="mt-9 grid grid-cols-2 gap-3" aria-label="معاينة توضيحية لبطاقة الذكريات بدون صور أشخاص">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-stampy-ochre/60 bg-white/5">
                    <span className="font-mono text-[10px] tracking-widest text-paper/60" dir="ltr">MOMENT 0{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/20 pt-5">
                <div><p className="text-xs text-stampy-ochre">اسم مكانك هنا</p><p className="mt-1 text-xl font-bold">الذكريات ملك الضيف.</p></div>
                <p className="font-mono text-xs text-paper/60" dir="ltr">SERIAL 1874</p>
              </div>
              <p className="mt-5 text-[11px] text-paper/60">تصميم توضيحي، بلا صور أو زيارات حقيقية.</p>
            </div>
            <div>
              <p className="eyebrow text-rust">التذكار / رقمي ومطبوع</p>
              <h2 className="display-heading mt-4 text-4xl sm:text-5xl">الفرق هو اللي<br />بيفضل في إيدهم.</h2>
              <p className="mt-6 max-w-lg text-base leading-9 text-ink/75">كل ختم يخلّي الضيف أقرب للمكافأة. ولو اختار يصوّر، تفضل الذكرى خاصة في حسابه لحد ما يشاركها هو. عند اكتمال الرحلة يظهر كارت قابل للطباعة بمقاس A6، جنب المكافأة — مش بدلها.</p>
              <Link href="/privacy" className="mt-8 inline-flex items-center gap-2 font-bold text-forest underline underline-offset-4">اقرأ سياسة الخصوصية <span aria-hidden="true">↖</span></Link>
            </div>
          </div>
        </section>

        <section id="venues" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <div className="max-w-3xl">
            <p className="eyebrow text-rust">لكل مكان يجمع الناس</p>
            <h2 className="display-heading mt-4 text-4xl sm:text-5xl">براندك قدّامهم.<br /><span className="text-forest">خصوصيتهم في إيدهم.</span></h2>
            <p className="mt-6 text-sm leading-8 text-ink/65">من الأماكن الصغيرة إلى الوجهات الكبيرة: كارت باسمك مع stampy. وروابطك، وعلاقات ضيوف مبنية على زيارات أكدها فريقك فقط. لا أحد يطّلع على صورة خاصة لمجرد أنه يدير المكان.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["01 / الهوية", "إطار يحكي حكايتك", "شعار المكان وألوانه وروابطه، مع هوية stampy. على بطاقة الزيارة والتذكار."],
              ["02 / العلاقة", "اعرف الزيارة، مش الصورة", "CRM ومكافآت من رصيد الزيارات المؤكدة. شاشة العرض لا ترى إلا ما أرسله الضيف لها ووافق عليه المسؤول."],
              ["03 / المحفظة", "كارتهم معاهم", "Apple وGoogle Wallet عبر WalletWallet بعد موافقة الضيف وربط المزوّد. الحملات والقرب يحتاجان خطة مناسبة واختبارًا على جهاز حقيقي."],
            ].map(([label, title, detail]) => (
              <article key={label} className="rounded-[1.75rem] border border-[#D5C0A8] bg-white p-7">
                <p className="eyebrow text-rust">{label}</p>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-8 text-ink/65">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24 md:px-10 md:pb-32">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 overflow-hidden rounded-[2.5rem] bg-forest px-8 py-12 text-paper shadow-[0_30px_70px_-40px_#451215] sm:px-12 md:py-16">
            <div className="max-w-xl">
              <p className="eyebrow text-stampy-ochre">جاهز تبدأ؟</p>
              <h2 className="display-heading mt-4 text-3xl sm:text-5xl">سيب أثرًا في كل زيارة.</h2>
              <p className="mt-5 text-sm leading-8 text-paper/75">أنشئ حساب مكانك، واضبط مكافأة تناسب ضيوفك. لن تُنشأ بيانات أو حسابات تجريبية حين لا تكون خدمة التسجيل مهيأة.</p>
            </div>
            <Link href="/login?mode=signup" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-stampy-ochre px-7 py-3 text-sm font-bold text-[#3D2314] transition hover:bg-[#efc57f]">إنشاء حساب المكان ↖</Link>
          </div>
        </section>
      </div>
      <footer className="border-t border-forest/10 px-5 py-8 text-sm md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
          <div><StampyLogo size="sm" showTagline={false} /><p className="mt-2 text-xs text-ink/60">Every moment is a stamp in time.</p></div>
          <div className="flex gap-6 text-xs font-bold text-ink/75"><Link href="/privacy" className="hover:text-rust">الخصوصية</Link><Link href="/terms" className="hover:text-rust">الشروط</Link><Link href="/login" className="hover:text-rust">دخول المكان</Link></div>
        </div>
      </footer>
    </main>
  );
}
