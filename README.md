# Café Memories

تطبيق Next.js 16 / React 19 / Supabase لذكريات الضيوف وزيارات الولاء **الموثّقة**. الواجهة الحالية تعتمد PostgreSQL مصدرًا للبيانات؛ لا تعتمد الزيارات أو الموافقات أو صلاحيات الموظفين على `localStorage`.

## تشغيل محلي

متطلبات: Node.js 20.9 أو أحدث (يفضّل 22)، و`corepack`/pnpm، ومشروع Supabase منفصل للتطوير. **لا تستخدم مشروع الإنتاج للاختبار**.

```bash
corepack pnpm install --frozen-lockfile
cp .env.example .env.local
# ضع قيم مشروع التطوير فقط في .env.local
corepack pnpm dev
```

طبّق `supabase/migrations/00001_initial_schema.sql` ثم `00002_product_refactor.sql` ثم `00003_secure_core.sql` على مشروع جديد. في مشروع قائم، راجع [دليل الترحيل](docs/DEPLOYMENT_AND_DATA_MIGRATION.md) قبل تطبيق `00003`؛ قد تتطلب البيانات القديمة معالجة يدوية. فعّل Email Auth مع تأكيد البريد وAnonymous Sign-ins في Supabase، واضبط عنوان الموقع و`/auth/callback` في عناوين إعادة التوجيه. رابط إنشاء حساب التاجر: `/login?mode=signup`؛ تنشأ المنشأة والفرع بعد تأكيد البريد داخل معاملة PostgreSQL. لا توجد حسابات تجريبية افتراضية. اضبط `NEXT_PUBLIC_SITE_URL` على أصل HTTPS النهائي لإنتاج روابط sitemap والبيانات الوصفية الصحيحة. Google OAuth اختياري ويتطلب إعداده لدى مزود الهوية ثم ضبط `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`؛ لا يظهر زره إن لم تُفعّله.

```bash
corepack pnpm db:types   # أنشئ أنواع قاعدة البيانات من الترحيلات في PostgreSQL محلي (PGlite)
corepack pnpm typecheck
corepack pnpm test       # تشمل اختبارات SQL/RLS في محرك PostgreSQL
corepack pnpm build
corepack pnpm lint
```

## حدود الثقة

- يستوثق الخادم من جلسة Supabase بـ`getUser()` ثم يتحقق من عضوية المنشأة والفرع قبل أي قراءة بمفتاح `service_role`؛ تعيد RLS تقييد الوصول المباشر عبر Supabase.
- الموظف وحده يؤكد الزيارة؛ المكافأة تُصرف في دالة PostgreSQL تقفل هوية الضيف وتتحقق من الأهلية ومفتاح تكرار الطلب.
- صور الضيف في bucket خاص، والخادم يمرّر الصور بعد فحص ملكية الضيف أو عضوية التاجر أو اقتران الشاشة والموافقة. لا تظهر الصورة على الشاشة بمجرد رفعها.
- لا يُصدر هذا الإصدار ملفات Wallet موقّعة ولا يدير مدفوعات أو طابعات متصلة. Endpoints القديمة التي كانت تمنح زيارات دون تحقق تعطّلت عمدًا.

## نشر مهم

**هذه النسخة تتطلب استضافة Next.js كخادم Node يدعم `sharp` وقراءة الأسرار في بيئة الخادم.** نشر Cloudflare Pages الثابت القديم غير متوافق مع API والـProxy وتوليد الصور؛ أُزيل خيار static export وإعداد Pages بدل تقديم واجهة غير آمنة/معطّلة. لا تدمج/تنشر هذه النسخة على الاستضافة القائمة دون نقلها إلى استضافة خادم وتجربة الترحيل. تفاصيل الاستعداد والمخاطر التشغيلية في [دليل النشر والترحيل](docs/DEPLOYMENT_AND_DATA_MIGRATION.md).
