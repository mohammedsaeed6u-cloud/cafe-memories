# STAMPY — سجل تنفيذ شريحة تأكيد الزيارة الحقيقية وخاتم الكاونتر (Verified Visit Slice)

**الفرع المعتمد:** `fix/terminal-verified-visit-rpc`  
**Base Commit:** `cefa205`  
**Commit التغييرات:** `a043306`  
**حالة شجرة العمل:** نظيفة تماماً (Working tree clean)  
**معيار التسليم:** الالتزام الصارم بمواصفة Arena (`[ARENA | APPROVED LIMITED IMPLEMENTATION]`) وحزمة تشغيل STAMPY (`ANTIGRAVITY_PLAYBOOK_AR.md` و`stampy-release-evidence`).

---

## 1. التغييرات المنفذة (Code Changes)

### 1.1 حماية جلسة الموظف (`src/lib/staff-session.ts`)
- إزالة fallback لسر التوقيع الثابت المعروف في الإنتاج.
- تطبيق مبدأ الفشل المغلق (Fail Closed): عند غياب سر التوقيع في بيئة الإنتاج (`NODE_ENV === 'production'`)، تُطلق الدالة استثناء فورياً وتمنع توليد أو اعتماد الجلسة.
- عدم طباعة أو إفشاء أي أسرار في السجلات أو تقارير الفحص.

### 1.2 مسار الـ API الخادمي للزيارات (`src/app/api/v1/visits/route.ts`)
- **إزالة أي INSERT مباشر** إلى جدول `visits` من مسار التأكيد نهائياً.
- **التحقق من جلسة التاجر:** التحقق الصارم عبر عميل خادمي موثق (`createClient()` مع `supabase.auth.getUser()`)، وإرجاع `401 Unauthorized` فوراً عند غياب الجلسة دون أي fallback إلى `service_role`.
- **التحقق من نطاق الفرع والمنشأة:** التحقق من وجود الفرع ونشاطه واشتقاق `organization_id` خادمياً من قاعدة البيانات، وعدم الثقة بأي قيمة يرسلها العميل.
- **التحقق من العضوية والصلاحية:** التأكد من وجود التاجر في `organization_members` للمنشأة ومطابقة الفرع في حال تقييد الموظف بفرع محدد (`403 Forbidden`).
- **استدعاء RPC المعتمد (`record_verified_visit`):**
  - تمرير المعرفات الثلاثة كـ UUID: `p_customer_id`, `p_branch_id`, `p_idempotency_key`.
  - معالجة القفل التنافسي الذري (`pg_advisory_xact_lock`).
  - معالجة إعادة الطلب (Replay): إرجاع `200 OK` مع `replayed: true` عند تكرار نفس المفتاح لنفس الزيارة.
  - رفض إعادة استخدام المفتاح لحمولة مختلفة (`409 Conflict` بناءً على رمز `22023`).
  - التحقق من حضور العميل الفعلي (`customer_checkins` خلال ساعتين)؛ وإرجاع `403 Forbidden` عند غيابه بناءً على رمز `42501`.
  - التحقق من فترة التهدئة (ساعة واحدة) وإرجاع `429 Too Many Requests` بناءً على رمز `23514`.
- **عزل الأعطال (Fault Isolation):** الزيارة المسجلة تظل معتمدة وثابتة في قاعدة البيانات. في حال حدوث عطل مؤقت أثناء قراءة التقدم أو الرصيد، يرجع الـ API نجاح الزيارة مع وسم `progressFetchFailed: true` دون إبطال الزيارة أو تكرار الختم.

### 1.3 كاونتر الخدمة بالواجهة (`src/app/(merchant)/terminal/page.tsx`)
- ربط زر الختم بالمسار الخادمي `POST /api/v1/visits` مع توليد `idempotencyKey` فريد (UUID v4) لكل عملية جديدة.
- **إلزامية المصادقة:** فحص جلسة التاجر وإظهار تنبيه بصري واضح مع رابط تسجيل الدخول، وقفل زر الختم لغير المسجلين.
- **منع التكرار وحالة المعالجة:** تفعيل حالة `isSubmittingStamp` وتعطيل الزر وإظهار مؤشر دوران (Spinner) أثناء معالجة الطلب لمنع النقر المتعدد.
- **المرونة عند انقطاع الاتصال:** في حال انقطاع الشبكة أو حدوث timeout، يتم الاحتفاظ بنفس `idempotencyKey` داخل `pendingIdempotencyKeyRef`، مع إظهار شريط تنبيه "النتيجة غير مؤكدة" وزر "إعادة المحاولة" لإرسال نفس المفتاح بأمان دون مخاطرة بختم مكرر.
- **عدم استباق النجاح:** عدم تشغيل صوت النجاح (`playStampChime`) أو إظهار شريط النجاح الأخضر إلا بعد استلام HTTP 200 بنجاح مؤكد من الخادم.
- **معالجة عزل عطل الرصيد:** إذا نجح تسجيل الزيارة ولكن تعذر جلب التقدم، تعرض الواجهة نجاح تسجيل الزيارة مع تنبيه تعذر تحديث الرصيد مؤقتاً وزر "تحديث الرصيد الآن" مستقل، دون إظهار فشل كاذب ودون السماح بختم مزدوج.

### 1.4 تحسين نموذج بيانات العميل (`src/lib/services/customer-registry.service.ts`)
- إضافة حقل `id?: string` لواجهة `RegisteredCustomer` لتخزين ومعالجة معرف UUID الحقيقي للعميل المشتق من قاعدة البيانات وربطه خادمياً.

---

## 2. أدلة التحقق الآلي (Automated Verification Evidence)

| الفحص | الأمر المنفذ | النتيجة |
|---|---|---|
| فحص الأنواع الصارم (TypeScript) | `pnpm exec tsc --noEmit` | **Pass (Exit Code 0 - 0 errors)** |
| حزمة اختبارات الزيارة المؤكدة (RPC & Fault Isolation) | `pnpm test tests/unit/terminal-verified-visit.test.ts` | **Pass (13/13 tests passed)** |
| حزمة اختبارات أمان جلسة الموظف | `pnpm test tests/unit/staff-session-hardening.test.ts` | **Pass (2/2 tests passed)** |
| اختبارات PIN والتحقق | `pnpm test tests/unit/staff-pin.test.ts` | **Pass (20/20 tests passed)** |
| اختبارات محرك المكافآت | `pnpm test tests/unit/rewards.test.ts` | **Pass (5/5 tests passed)** |
| فحص الأنواع الصارم (TypeScript) | `pnpm exec tsc --noEmit` | **Pass (Exit Code 0 - 0 errors)** |
| فحص تنسيق الشفرة والمسافات | `git diff --check` | **Pass (Exit Code 0)** |
| بناء تصدير الصفحات الثابتة | `pnpm run build` | **Pass (33/33 static pages generated successfully)** |

---

## 3. حالات الاختبار التي تم تغطيتها في `terminal-verified-visit.test.ts` (13 اختباراً)

1. `rejects unauthenticated requests with HTTP 401 Unauthorized`
2. `rejects requests with malformed or missing UUID fields with HTTP 400 Bad Request`
3. `rejects requests targeting an inactive or non-existent branch with HTTP 404`
4. `rejects caller if not a member of the branch organization with HTTP 403 Forbidden`
5. `rejects caller if restricted to a different branch with HTTP 403 Forbidden`
6. `maps RPC 42501 guest check-in failure to HTTP 403 with clear directive`
7. `maps RPC 23514 cooldown rejection to HTTP 429 Too Many Requests`
8. `handles replayed duplicate requests returning HTTP 200 with replayed: true`
9. `maps RPC 22023 idempotency mismatch to HTTP 409 Conflict`
10. `rejects caller with unauthorized role (e.g. guest or viewer) with HTTP 403 Forbidden (RBAC)`
11. `enforces fault isolation when count query returns an error object without throwing`
12. `enforces fault isolation when reward_rules query returns an error object`
13. `never performs direct visits table INSERT in POST handler`

---

## 4. معالجة ملاحظات مراجع Arena العشر (Arena Reviewer Points Remediated)

1. **إلغاء تخمين رقم الهاتف (CRM phone guessing):** تم حذف مسار البحث التخميني أو اعتماد أول عميل تلقائياً عند عدم وجود معرف صريح، وفشل العملية مغلقة مع رسالة خطأ صريحة.
2. **فحص أخطاء Supabase الصريح وعزل الأعطال:** لا تفترض استدعاءات `supabase.from()` رمي الاستثناءات عند فشل الاستعلام، بل يتم فحص `countError` و`rulesError` بشكل صريح. عند الفشل، تُرجع القيم كـ `null` دون تزييف العدادات أو إبطال الزيارة المعتمدة.
3. **إلغاء حسابات الموديلو الساذجة:** إزالة `(visits % requiredVisits)` وبطاقات المكافآت المصطنعة بالكامل من الواجهة، والاعتماد حصرياً على بيانات الخادم الحقيقية.
4. **تثبيت حمولة إعادة المحاولة (Immutable Pending Operation):** تم استبدال تخزين المفتاح المجرد بـ `pendingOperationRef.current = { idempotencyKey, customerId, branchId }` لضمان تطابق الحمولة عند إعادة الإرسال وعدم تأثرها بتغيير المدخلات.
5. **سياق الفرع الحتمي:** مطابقة `branches.slug = cafeSlug` بدقة قبل اللجوء إلى أي فرع افتراضي.
6. **إنفاذ صلاحيات الختم (Stamping RBAC):** حصر صلاحية الختم في الأدوار المعتمدة (`owner`, `admin`, `manager`, `cashier`, `staff`) ورفض ما عداها بـ `403 Forbidden`.
7. **نظافة عداد الوردية والاحتفال عند إعادة الطلب (Replay Hygiene):** عند استلام `replayed: true`، يتم منع زيادة عداد وردية الكاشير وتخطي صوت الاحتفال، مع إظهار إشعار صريح بتكرار الطلب.
8. **فصل استعلامات التقدم عن نتيجة الختم:** التحقق من ثبات نجاح الزيارة حتى لو فشلت أي من استعلامات القراءة اللاحقة.
9. **حزمة اختبارات موسعة لأخطاء Supabase:** إضافة اختبارات لمحاكاة إرجاع كائن خطأ من Supabase دون رمي خطأ.
10. **توافق كامل مع وثائق ومواصفات Arena:** اجتياز الفحوصات الآلية بنسبة 100%.

---

## 5. قيود وحدود التحقق (Known Limitations)

1. **البيئة المستضافة (Hosted Supabase):** الاختبارات نُفذت باستخدام حزمة اختبارات وحدة صارمة تحاكي سلوك استجابات محرك Postgres وRPC `record_verified_visit`.
2. **عزل الفرع:** لم يتم دمج الفرع في `main` ولم يتم النشر إلى الإنتاج، التزاماً ببروتوكول Arena. تم رفع التغييرات إلى الفرع البعيد `fix/terminal-verified-visit-rpc`.

