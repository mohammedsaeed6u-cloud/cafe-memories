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

| الفحص | الملف / الأمر | النتيجة |
|---|---|---|
| اختبارات تفاعل وتحكم الواجهة (Interaction & Concurrency Tests) | `pnpm test tests/unit/terminal-ui-interaction.test.tsx` | **Pass (7/7 tests passed)** |
| حزمة اختبارات مسار الزيارات المعتمد (RPC Handler Unit Mocks) | `pnpm test tests/unit/terminal-verified-visit.test.ts` | **Pass (13/13 tests passed)** |
| اختبارات PIN والتحقق | `pnpm test tests/unit/staff-pin.test.ts` | **Pass (20/20 tests passed)** |
| اختبارات محرك المكافآت | `pnpm test tests/unit/rewards.test.ts` | **Pass (5/5 tests passed)** |
| حزمة اختبارات أمان جلسة الموظف | `pnpm test tests/unit/staff-session-hardening.test.ts` | **Pass (2/2 tests passed)** |
| **إجمالي اختبارات الوحدة والتفاعل** | **5 ملفات اختبار متكاملة** | **Pass (47/47 tests passed 100%)** |
| فحص الأنواع الصارم (TypeScript) | `pnpm exec tsc --noEmit` | **Pass (Exit Code 0 - 0 errors)** |
| فحص تنسيق الشفرة والمسافات | `git diff --check` | **Pass (Exit Code 0)** |
| بناء تصدير الصفحات الثابتة | `pnpm run build` | **Pass (33/33 static pages generated successfully)** |

---

## 3. حالات الاختبار التي تم تغطيتها في `terminal-ui-interaction.test.tsx` (7 اختبارات تفاعلية حقيقية)

1. `prevents double-click / parallel stamp submissions using synchronous in-flight guard`: منع تكرار النقر المزدوج المتوازي فوراً عبر حارس تزامن لحظي، وضمان استدعاء `fetch` مرة واحدة فقط.
2. `suppresses audio chime and shift counter increment on duplicate replay (replayed: true)`: كتم صوت الاحتفال ومنع زيادة عداد الوردية عند استرجاع طلب مكرر.
3. `triggers audio chime and increments shift counter on fresh verified visit`: تشغيل صوت الختم وزيادة عداد الوردية عند نجاح زيارة مؤكدة جديدة.
4. `does NOT corrupt customer card if customer selection changed during in-flight submission`: حماية بيانات العميل النشط في حال قيام الكاشير باختيار عميل آخر أثناء وجود طلب قيد المعالجة (ربط الاستجابة بـ customerId المثبت للعملية فقط).
5. `guarantees immutable retry payload with identical idempotencyKey on retry after network failure`: ثبات حمولة إعادة المحاولة بنفس المفتاح والمعرفات بالضبط دون إعادة بنائها من حالة الواجهة.
6. `handleRefreshProgress never calls CRM search or swaps customer identity`: الامتناع التام عن البحث بالهاتف في CRM أو استبدال هوية العميل عند تحديث الرصيد.
7. `blocks stamp dispatch when merchantBranchId is not matched to venue context`: منع إرسال الختم وإظهار خطأ صريح عند تعذر مطابقة الفرع مع سياق الكاونتر.

---

## 4. معالجة ملاحظات مراجع Arena الإضافية المثبتة (Round 2 Remediation)

1. **حذف تخمين CRM في `handleRefreshProgress` نهائياً:** تم إلغاء أي اتصال بـ `/api/v1/crm/customers` وإلغاء استبدال `customer.id` أو الاعتماد على `customers[0]`. تم توضيح فصل مزامنة الرصيد عن تأكيد الزيارة في هذه الشريحة المحدودة.
2. **إلغاء البحث عن أول فرع تلقائياً (`limit(1).maybeSingle`):** حظر اعتماد أي فرع افتراضي عند عدم مطابقة `branches.slug = cafeSlug`. في حال عدم المطابقة، يتم إيقاف العملية وإظهار رسالة خطأ قطعية للكاشير.
3. **إلغاء حسابات الموديلو الساذجة خادمياً:** تم حذف استدعاء `calculateRewardProgress` وقواعد المكافآت من مسار `/api/v1/visits`، وإرجاع `rewardProgress: null` صراحة، بما يتماشى مع فصل نموذج كروت التذكار المعتمدة.
4. **حماية التزامن وربط الاستجابة بالعملية المثبتة:**
   - تطبيق حارس تزامني متزامن لحظي (`isSubmittingStampRef.current`) لمنع أي نقر متوازٍ قبل تحديث حالة React.
   - ربط تحديثات الكارت بالـ `customerId` الخاص بالعملية المثبتة عبر `selectedCustomerRef`؛ بحيث لو غيّر الكاشير العميل أثناء انتظار الرد لا تتأثر بطاقة العميل الجديد.
5. **اختبارات تفاعل واجهة حقيقية (`terminal-ui-interaction.test.tsx`):** إضافة حزمة اختبارات كاملة باستخدام `happy-dom` و`@testing-library/react` للتحقق الحقيقي من حالات النقر المزدوج، كتم الصوت عند الـ replay، وثبات مفتاح العملية عند إعادة المحاولة.
6. **دقة تقرير الأدلة:** تصنيف حزم الاختبارات بدقة وفصل اختبارات الواجهة والتفاعل (7 اختبارات) عن اختبارات محاكاة الـ Handler (13 اختباراً).

---

## 5. قيود وحدود التحقق (Known Limitations)

1. **البيئة المستضافة (Hosted Supabase):** الاختبارات نُفذت باستخدام حزم اختبارات وحدة وتفاعل واجهة صارمة تحاكي سلوك استجابات محرك Postgres وRPC `record_verified_visit`.
2. **عزل الفرع:** لم يتم دمج الفرع في `main` ولم يتم النشر إلى الإنتاج، التزاماً ببروتوكول Arena. تم رفع التغييرات إلى الفرع البعيد `fix/terminal-verified-visit-rpc`.

