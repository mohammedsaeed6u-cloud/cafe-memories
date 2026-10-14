# خطة نشر وترحيل Café Memories — 14 أكتوبر 2026

> **لم تُطبّق هذه الترحيلات على مشروع Supabase منشور في هذه الجلسة.** اختبارات PGlite تشغّل PostgreSQL وRLS والدوال مع بدائل محلية مبسطة لـ`auth` و`storage`؛ لا تثبت توافق بيئة الإنتاج أو الطلبات المتزامنة عبر اتصالات مستقلة أو سياسات Storage المخصصة الموجودة على مشروعكم. اختبر مشروع staging بنسخة من البيانات والتهيئة أولًا.

## المتطلبات والنشر

1. جهّز استضافة **Node** لتطبيق Next.js 16 تدعم مكتبة `sharp` الأصلية ورفع ملفات حتى 10 MB (وغالبًا حد طلب أعلى قليلًا بعد multipart). **Cloudflare Pages static export لم يعد يعمل؛ Cloudflare Workers لا يدعم `sharp` الأصلي بهذا المسار دون إعادة تصميم معالجة الصور.** أوقف أو انقل النشر القديم بعد التأكد من نجاح البديل.
2. أنشئ مشروع Supabase staging، واحفظ نسخة احتياطية/نقطة استعادة من قاعدة الإنتاج وStorage. املأ `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY` في أسرار منصة الخادم؛ الأخير لا يوضع في المتصفح أو في Git. اضبط عنوان الموقع ورابطي `/auth/callback` و`/auth/customer/callback` (بما يشمل query parameters، وفق صيغة Supabase allowlist) في Auth URL Configuration. فعّل Email Auth مع تأكيد البريد وAnonymous Sign-ins؛ لإتاحة زري Google اضبط Google OAuth Client في Google Cloud بعنوان Supabase Auth callback، وفعّل Google Provider في Supabase. فعّل **Enable Manual Linking** لربط ضيف له صور/رصيد بهويته الحالية. ضع `NEXT_PUBLIC_SITE_URL` على أصل HTTPS النهائي لتحسين canonical/sitemap دون روابط استضافة قديمة.
3. طبّق SQL بترتيب `00001` → `00002` → `00003` → `00004_customer_accounts.sql` في مشروع جديد؛ أو `00003` ثم `00004` بعد أول ترحيلين في مشروع موجود. إن كان `00003` مطبّقًا بالفعل، أضف `00004` فقط (لا تعدّل ترحيلًا مطبّقًا). نفّذ استعلامات الفحص أدناه **قبل** `00003` وعالج أي تعارض. الترحيل مقصود به خطوة واحدة على قاعدة متوقفة عن الكتابة، لا تطبيقه أثناء مرور طلبات قديمة.
4. افحص الدور `authenticated` وصلاحيات schema/public/Storage في مشروع Supabase الحقيقي؛ لا تعتمد على PGlite وحده. أعد نشر التطبيق بعد نجاح الترحيل، لا قبل ذلك. سجّل حساب منشأة (بالبريد ثم Google بعد تفعيل موفره)، وافتح QR فرع كضيف واختر الجلسة المجهولة، واحفظ اسمه ورقم تواصل اختياريًا ثم صوّر؛ تأكد من بقاء الإعدادات بعد إعادة التحميل، وظهور الصورة «pending» خاصّة وأن الزيارة لا تُحتسب حتى يؤكدها الموظف. اربط Google بهذه الجلسة بعد تفعيل Manual Linking وتأكد من ثبات `auth_user_id` ومعرّف العميل ورصيد الزيارات/الصور، ثم جرّب الدخول من جهاز آخر. جرّب أيضًا دخول Google من جهاز بدون جلسة ضيف لاسترجاع الحساب. إن كان Google مستخدمًا بحساب مختلف، تحقق من فشل الربط دون حذف هوية الضيف؛ يلزم دعم/تحقق من الحسابين قبل أي نقل يدوي. أنشئ QR وScreen pairing وراجع سحب الموافقة في جهازين مختلفين.
5. اضبط قيود معدل الطلبات عند الحافة (خصوصًا إنشاء الجلسات المجهولة، رفع الصور، QR، وإدخال رمز الاقتران). لا تضبط `TRUSTED_CLIENT_IP_HEADER` إلا إذا كانت بوابة الدخول تزيل القيمة القادمة من العميل وتستبدلها بعنوانه الحقيقي؛ بدونه يستخدم الاقتران سلة محدودة مشتركة بدل الاعتماد على `x-forwarded-for` قابل للتزوير. حد الرفع اليومي في قاعدة البيانات (20 صورة/ضيف) لا يمنع حسابات مجهولة جديدة بالجملة. راقب استهلاك Supabase Storage وذاكرة خادم `sharp` وأخطاء `503`.

## فحوص البيانات قبل تطبيق 00003

نفّذ على نسخة معزولة أولًا، ثم على قاعدة التشغيل بعد إيقاف كتابات النسخة القديمة. **استعلام دور المنصة يُراجع يدويًا** ولا يُشترط أن يخلو من مديرين شرعيين. بقية استعلامات التعارض يجب أن تعيد **صفر صف**؛ قد يفشل `00003` عند تفرد `auth_user_id` أو القيود الجديدة، ولا ينبغي حذف بيانات ضيف تلقائيًا:

```sql
-- راجع كل أدوار المنصة القديمة يدويًا؛ قبل 00003 كان المستخدم يستطيع ترقية نفسه.
SELECT id, email, created_at FROM public.users WHERE role = 'admin';
-- صفّر الترقيات غير المصرح بها بعد التحقق الإداري، قبل نشر /admin.

-- تكرار الحساب الواحد في ملف أكثر من ضيف.
SELECT auth_user_id, count(*) FROM public.customers
WHERE auth_user_id IS NOT NULL GROUP BY auth_user_id HAVING count(*) > 1;

-- فروع وأعضاء وزيارات وصور وشاشات بمعرف منشأة غير مطابق.
SELECT m.id FROM public.organization_members m JOIN public.branches b ON b.id=m.branch_id
WHERE m.branch_id IS NOT NULL AND m.organization_id<>b.organization_id;
SELECT v.id FROM public.visits v JOIN public.branches b ON b.id=v.branch_id
WHERE v.organization_id<>b.organization_id;
SELECT m.id FROM public.memories m JOIN public.visits v ON v.id=m.visit_id
WHERE m.customer_id<>v.customer_id OR m.organization_id<>v.organization_id OR m.branch_id<>v.branch_id;
SELECT m.id FROM public.memories m JOIN public.branches b ON b.id=m.branch_id
WHERE m.organization_id<>b.organization_id;
SELECT c.id FROM public.memory_consents c JOIN public.memories m ON m.id=c.memory_id
WHERE c.customer_id<>m.customer_id;
SELECT q.id FROM public.qr_codes q JOIN public.branches b ON b.id=q.branch_id
WHERE q.organization_id<>b.organization_id;
SELECT s.id FROM public.screens s JOIN public.branches b ON b.id=s.branch_id
WHERE s.organization_id<>b.organization_id;
SELECT p.id FROM public.screen_pairing_codes p JOIN public.branches b ON b.id=p.branch_id
WHERE p.organization_id<>b.organization_id;
```

**زيارة قديمة برمز `verified` وبدون `verified_at` تُحوَّل تلقائيًا إلى `suspicious`** عند تطبيق `00003`؛ لأن المسار القديم لم يتحقق من موظف. لا يستهلكها محرك المكافآت. إن توافرت أدلة شراء/موظف موثوقة، يستطيع مسؤول قاعدة البيانات وحده **قبل `00003`** إضافة عمود `verified_at` (`ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS verified_at timestamptz`) ثم تعيينه للصفوف المدققة فقط (مثل `created_at` لتاريخ الشراء المثبت)؛ لا تملأ العمود لجميع الزيارات القديمة. راجع كذلك أحداث `reward_events` القديمة؛ الصرف السابق قد يُحسب على الرصيد الجديد حتى إن حُجرت الزيارات المرتبطة به. احفظ نسخة احتياطية وخطة لتوضيح أثر ذلك لرصيد العملاء قبل النشر.

يُصفّر `00003` موافقة العرض وحالة ظهور الصور القديمة على شاشة الصالة افتراضيًا؛ يحتاج نشر أي صورة تاريخية إلى موافقة جديدة ومراجعة. وجود صور في `storage` أو عمود URL عام قديم لا يعني أن الضيف وافق على عرضها. لا تُدخل الصور أو الأختام المخزنة في متصفح النسخة القديمة كزيارات `verified`. صور قديمة بروابط عامة (داخل Supabase أو خارجه) **لا يخدمها Proxy الجديد**؛ يجب نقلها بموافقة صاحبها إلى مفاتيح خاصة بالنمط الجديد وربطها بمالكها بعد تدقيق. تغيّر bucket `memories` إلى خاص، لكن نسخ CDN وURL العامة القديمة قد تبقى مخزنة: راجع سياسات التخزين القديمة، أبطل روابط/كاش عام بعد النقل، ودقّق الملكية والموافقات. مفاتيح الصور الجديدة تأتي بنمط `orgId/customerId/randomId/*.webp` بعد إزالة EXIF.

روابط تأكيد تسجيل المنشأة التي أُصدرت **قبل** إضافة `flow=email` تُرفض في callback الجديد بدل تخمين نوع الحساب وإنشاء منشأة بالخطأ؛ أصدر رابط تأكيد حديثًا لأصحاب الحسابات المعلقة بعد التحقق من التسجيل، ولا تُشغّل مسار callback القديم لمجرد دعم الروابط القديمة.

## التحقق بعد الترحيل

```sql
-- بعد تنظيف بيانات قديمة غير متطابقة، فعّل التحقق الكامل للقيود المضافة NOT VALID.
ALTER TABLE public.visits VALIDATE CONSTRAINT verified_visit_has_timestamp;
ALTER TABLE public.visits VALIDATE CONSTRAINT visits_branch_org_fk;
ALTER TABLE public.memories VALIDATE CONSTRAINT memories_visit_identity_fk;
ALTER TABLE public.qr_codes VALIDATE CONSTRAINT qr_branch_org_fk;
ALTER TABLE public.screens VALIDATE CONSTRAINT screens_branch_org_fk;
ALTER TABLE public.organization_members VALIDATE CONSTRAINT members_branch_org_fk;
ALTER TABLE public.memory_consents VALIDATE CONSTRAINT consents_memory_customer_fk;
ALTER TABLE public.screen_pairing_codes VALIDATE CONSTRAINT pairing_branch_org_fk;
```

في staging، اختبر بهويتين من منشأتين مختلفتين، موظف فرع واحد، ضيف صورته خاصة ثم عرضها ثم سحب الإذن، ورمز اقتران منتهيًا/مستخدمًا. نفّذ طلبَي صرف مكافأة متزامنين من **اتصالَي PostgreSQL مستقلين** بعد بلوغ العتبة؛ يجب أن ينجح واحد فقط. اختبارات PGlite المحلية تستخدم اتصالًا واحدًا ولا تحل محل اختبار تنازع واقعي. جرّب الرفع من هاتف على المتصفح الفعلي، وتأكد من حد استضافة ملفات multipart.

## ملاحظات المنتج والبيانات

- تصدر الموافقة على شاشة الصالة من الضيف لكل صورة، افتراضيًا **لا**. مراجعة التاجر إلزامية. تغذية الشاشة تُستطلع كل 15 ثانية (مهلة اتصال 8 ثوان)؛ إلغاء الموافقة يمنع كل طلب صورة جديد، وقد يظل إطار سبق تحميله حتى دورة الشاشة التالية. عند تعذر التحقق أو فشل طلب صورة تُخفى الصور بدل إبقائها في العرض بلا اتصال.
- صفحة الضيف تعرض خيار Google أو جلسة مجهولة؛ بيانات الحساب (الاسم ورقم التواصل الاختياري) في PostgreSQL لا `localStorage`. `00004` ينشئ جدول `customer_accounts` الخاص للرقم؛ لا تسمح RLS للموظف بقراءته، ولا يعدّ الرقم هويةً موثوقة. يحتفظ ربط Google الناجح بالـ`auth_user_id` نفسه، ولا يوجد دمج ذاتي لحساب Google مستخدم وهوية ضيف أخرى. لا تُسترجع الأسماء/الهواتف والصور التي كانت مخزنة محليًا قبل الإصدار الجديد تلقائيًا؛ يلزم مسار يدوي موثق بإثبات ملكية قبل استيراد أي شيء.
- فتح الضيف صفحة الفرع وهو مسجل بجلسة Supabase يُنشئ `customer_checkins` صالحة لساعتين في هذا الفرع؛ هذا ليس إثبات شراء. لا يبحث الموظف عن ضيف أو يؤكد زيارته أو يصرف مكافأته حتى يحضر لهذا الفرع حديثًا، ثم يُجري الموظف التحقق من الشراء في الواقع.
- تسجل صور الضيف زيارة `pending` مرتبطة بالصورة؛ الموظف عند تأكيد شراء خلال 24 ساعة يرقّي أحدث زيارة معلّقة وإلا ينشئ زيارة جديدة. حد بين زيارتين موثّقتين ساعة؛ `verified_at` منفصل عن تاريخ الصورة. افتح صفحة الضيف مجددًا إذا انتهت نافذة الحضور.
- لا يوجد مسار حذف حساب الضيف مع حذف ملفات Storage المترابطة ونسخ النسخ الاحتياطية، ولا إدارة دعوات موظفين، ولا Google/Apple Wallet مُوقّع، ولا فوترة حقيقية أو طباعة متصلة. **لا تعتبرها ميزات جاهزة للإنتاج.** ضياع جلسة الضيف المجهولة يمحو قدرته على إثبات ملكية صوره بنفسه؛ إجراءات دعم الاسترجاع/الحذف تتطلب تصميمًا تشغيليًا ومراجعة قانونية قبل الإطلاق العام.
- شهادات الصحة وبيانات الفوترة السابقة كانت افتراضية. صفحة `/admin` الجديدة تعرض فقط أعداد قواعد البيانات المصرح بها، وتستلزم تعيين دور منصة من مسار إداري آمن (لا يمكن للمستخدم ترقية نفسه). الحسابات المحلية القديمة وكلمات المرور وPIN في المتصفح **لا تُهاجَر** تلقائيًا.

**المسؤولية التشغيلية:** راجع سجلات الأخطاء دون تسريب صور أو مفاتيح، خطط لتنظيف أي ملفات خاصة يتيمة إذا فشل طلب إزالة Storage بعد فشل معاملة، واضبط سياسة احتفاظ/حذف ونسخ احتياطي قبل قبول بيانات حقيقية.
