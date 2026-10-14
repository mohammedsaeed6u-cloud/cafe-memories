import Link from "next/link";
import { StampyApertureIcon } from "@/components/brand/StampyLogo";

/** A missing tenant or screen must remain a real 404, never render demo data. */
export default function NotFoundPage() {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-paper p-6 text-ink"
    >
      <div className="paper-card max-w-md rounded-[2rem] p-8 text-center sm:p-10">
        <StampyApertureIcon size={54} />
        <p className="eyebrow mt-4 text-rust">404 · stampy.</p>
        <h1 className="display-heading mt-3 text-3xl">الصفحة مش هنا.</h1>
        <p className="mt-4 text-sm leading-8 text-ink/60">
          تحقق من رابط المنشأة أو رمز الفرع، أو اطلب رابطًا جديدًا من فريق
          المكان.
        </p>
        <Link href="/" className="action-primary mt-7">
          العودة للرئيسية <span aria-hidden="true">↖</span>
        </Link>
      </div>
    </main>
  );
}
