import MerchantLoginClient from '@/components/auth/MerchantLoginClient';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ mode?: string; error?: string; setup?: string }>;
}) {
  const { mode, error, setup } = await searchParams;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(url?.startsWith('https://') && !url.includes('YOUR_PROJECT') &&
    key && !key.includes('YOUR_SUPABASE'));
  const setupError = error === 'setup-failed'
    ? 'تعذر إكمال إنشاء المنشأة بعد تسجيل الدخول. تحقّق من بريدك وجرّب الدخول مجددًا، أو تواصل مع مسؤول المنصة.'
    : error === 'missing-code' ? 'رابط تأكيد البريد غير صالح. افتح رابط التأكيد من الرسالة مرة أخرى.'
    : error === 'wrong-flow' ? 'رابط الدخول لا يخص المنشأة أو انتهت صلاحيته. ابدأ Google من صفحة المنشأة، أو اطلب رابط تأكيد بريد جديد إذا كان الرابط قديمًا.'
    : setup === '1' ? 'الحساب موجود لكن المنشأة لم تُنشأ بعد. سجّل دخولك لإكمال إعدادها.' : null;
  return <MerchantLoginClient initialMode={mode === 'signup' ? 'signup' : 'signin'}
    setupError={setupError} configured={configured} />;
}
