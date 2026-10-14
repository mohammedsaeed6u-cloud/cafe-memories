# الاختبار الفعلي

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm lint
```

`tests/integration/database-security.test.ts` يطبّق الترحيلات الخمسة في PostgreSQL عبر PGlite مع بدائل مبسطة لـSupabase Auth/Storage، ثم يفحص RLS والزيارات والصور الاختيارية وكروت الاستحقاق والثبات بعد تعديل القاعدة وترحيل التاريخ والمكافآت والموافقة والاقتران. اختبارات الوحدة تغطي حدود API ومسار إنشاء المنشأة ومفاتيح الوسائط ومعالجة الصور؛ **اجتيازها لا يثبت مسارات Supabase الفعلية أو الأمان التشغيلي بالكامل**. تعرّف إجراءات staging والتزامن الحقيقية في [دليل النشر](DEPLOYMENT_AND_DATA_MIGRATION.md).

لا توجد في هذا المستودع قياسات حمل معتمدة أو اختبارات E2E في متصفح متصل بمشروع Supabase. لا تذكر أي رقم RPS على أنه نتيجة محققة.
