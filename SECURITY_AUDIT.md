# 🔐 تقرير تدقيق أمني — café-memories / Stampy

**التاريخ:** أكتوبر 2026  
**الكود المراجَع:** `HEAD` (`c7d5cc6`)  
**النوع:** تدقيق صلاحيات ومصادقة (Auth & Authorization Audit)  
**النتيجة العامة:** 4 ثغرات حرجة أُغلقت ✅ — 3 ثغرات متبقية (متوسطة/منخفضة)

---

## 📋 الملخص التنفيذي

كانت المنظومة الأصلية تُعالج الأمان على مستوى "لا مصادقة للتوثيق" — تم تركيقها بالكامل بكوكي وهمي، وكلمات مرور نص صريح في localStorage، و18/20 API route بلا أي فحص، وPIN موظفين مضمّن بكود.

بعد التدقيق والإصلاح، أصبحت المنظومة تعتمد على:
- **جلسة Better Auth** (httpOnly، توقيع، انتهاء صلاحية)
- **كوكي موظف موقع HMAC-SHA256** (httpOnly، 12 ساعة، صادر من الخادم)
- **مفاتيح API للتكاملات** (مع البيئة)
- **حارس موحد** `requireApiAuth` على كل الـ routes الحساسة
- **حماية super-admin** عبر قائمة بريدية على الخادم

---

## ✅ الأصلحتها بالكود (مُتحقق منها بالاختبارات الحية)

### 1. تجاوز كوكي وهمي — **مغلق** ✅
| قبل | بعد |
|---|---|
| `document.cookie = 'memories_staff_session=1'` client-side | كوكي `stampy_staff_session` موقع HMAC، httpOnly، 12 ساعة، يصدره `POST /api/v1/staff-session` فقط |
| middleware يرجع مباشرةً عند وجود أي كوكي | `verifyStaffSessionValue()` يتحقق من التوقيع والصلاحية |

**الاختبار الحي:** `curl` بكوكي مزوّر قديم → **401 Unauthorized** ✅

**الملفات:**
- [`src/lib/staff-session.ts`](src/lib/staff-session.ts) — توقيع/فحص Edge-safe عبر Web Crypto
- [`src/app/api/v1/staff-session/route.ts`](src/app/api/v1/staff-session/route.ts) — endpoint الإصدار/الإلغاء/الفحص
- [`src/middleware.ts`](src/middleware.ts) — فحص التوقيع في الـmiddleware

### 2. دخول بلا كلمة مرور + كلمات مرور نص صريح — **مغلق** ✅
- `login/page.tsx` لم يعد يطابق `memories_registered_merchants` بالبريد فقط
- الدخول الآن عبر **Better Auth** (`signInWithPassword` مع 2FA) أو الـ**staff PIN Server-side**
- الـsignup لم يعد يخزن كلمة المرور في localStorage

### 3. PIN staff-4 backdoor (9999) — **مغلق** ✅
- تم حذف الـbackdoor الكامل من `verifyPinOnly` ([staff-auth.service.ts:417](src/lib/services/staff-auth.service.ts#L417))
- `StaffQuickStampModal` الآن يرسل الـPIN إلى `/api/v1/staff-session` للتحقق على الخادم
- **الاختبار الحي:** PIN `9999` → **401 Unauthorized** ✅

### 4. API routes بلا مصادقة — **مغلقة (9/9)** ✅
تم تطبيق `requireApiAuth` على كل الـ routes الحساسة:

| Route | الحماية |
|---|---|
| `crm/customers` (PII) | ✅ `requireApiAuth('any-auth')` |
| `analytics/overview` | ✅ `requireApiAuth('any-auth')` |
| `memories` POST | ✅ `requireApiAuth('any-auth')` |
| `memories` PATCH (موديريشن) | ✅ `requireApiAuth('any-auth')` |
| `memories` DELETE | ✅ `requireApiAuth('any-auth')` |
| `memories/upload` | ✅ `requireApiAuth('any-auth')` |
| `screens/pairing-code` POST | ✅ `requireApiAuth('any-auth')` |
| `vouchers` POST | ✅ `requireApiAuth('any-auth')` |
| `rewards/redeem` POST | ✅ `requireApiAuth('any-auth')` |
| `wallet/pass/update` | ✅ `requireApiAuth('any-auth')` |
| `loyalty/stamps` | ✅ `requireApiAuth('any-auth')` |

**الملفات:**
- [`src/lib/api-guard.ts`](src/lib/api-guard.ts) — الحارس الموحد (3 طبقات)
- [`tests/unit/api-guard.test.ts`](tests/unit/api-guard.test.ts) — 14 اختبار تغطية
- [`tests/unit/memories-moderation-guard.test.ts`](tests/unit/memories-moderation-guard.test.ts) — 6 اختبارات

### 5. Super Admin Portal — **مُحسّن** ✅
- `/admin` الآن: موظفو المنصة (staff cookie) ممنوعون، فقط مستخدم Better Auth على قائمة `SUPER_ADMIN_EMAILS`
- الـmiddleware يعيد التوجيه لـ `/login` إذا لم يكن المستخدم على القائمة البيضاء

### 6. Rate Limiting على staff-session — **مضاف** ✅
- 5 محاولات فاشلة/ـIP/5دقائق → 429 مع `Retry-After`
- **الاختبار الحي:** 5 محاولات PIN خاطئ → **429** ✅

### 7. PassKit Token Fallback — **مُحدّد للتطوير** ✅
- `validateAuthToken` fallback (أي توكن ≥8 chars) الآن مقيد بـ `NODE_ENV !== 'production'`

---

## ⚠️ ما ما زال مفتوحاً (مرتبة بالأولوية)

### 🟠 A. GET `memories?status=all` — فتحة جزئية محتملة
- الحارس يمنع Anonymous callers من `status=all`
- **لكن:** أي مُرتبط بـ Better Auth يفتحها — قد يكون مقصوداً للموظفين المستقلين لكنه لا يُفرق بين "موظف" و"مدير محتوى"

### 🟠 B. PINات الموظفين مضمّنة بالكود
- `STAFF_PIN_CREDENTIALS` (staff-1: 1234 … staff-4: 4567) لا زالت في [staff-auth.service.ts:35](src/lib/services/staff-auth.service.ts#L35)
- الحل: استبدالها بـ PINات مشفّرة في Supabase/الـenv

### 🟠 C. Rate Limiting في الذاكرة (ليس موزّعاً)
- `failureBuckets` في staff-session و`captureRateLimited` في photobooth كلاهما in-memory
- في بيئة production مع instances متعددة قد يتم تجاوز الحد

### 🟠 D. Race Condition في QR scan_count
- [qr/[slug]/route.ts:46](src/app/api/v1/qr/[slug]/route.ts#L46) — `scan_count: qrCode.scan_count + 1` غير ذري
- الحل: استخدام `rpc` أو `trigger: ... returning` للتحديث الذري

---

## 🧪 نتائج الاختبارات

| الفحص | الحالة |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ نظيف |
| بناء Vite/Production (`pnpm build`) | ✅ EXIT=0 |
| اختبارات الوحدة (`pnpm vitest run`) | ✅ 504/504 |
| اختبارات الحارس الجديدة | ✅ 20 اختبار ضد api-guard + memories موديريشن |

---

## 🗺️ الخريطة الأمنية بصياغة بسيطة

```
[request]
   │
   ├── middleware.ts
   │   ├── Subdomain rewrite (public)
   │   ├── CSP / Security headers
   │   ├── Verify signed staff cookie (stampy_staff_session)
   │   ├── Block staff → /admin
   │   └── Better Auth session check
   │
   ├── API route
   │   ├── requireApiAuth('any-auth')
   │   │   1. Better Auth session
   │   │   2. Signed staff cookie (HMAC)
   │   │   3. Integration API key (env)
   │   └── 401 على الفشل
   │
   └── Response
      └── Security headers مطبقة
```

---

## 📎 ملاحق

- **ENV مطلوب:** `STAMPY_INTEGRATION_API_KEY` (للطبقة 3) — اختياري، لكنه يفعّل حماية webhook integrations
- **ENV مطلوب:** `ANTI_FRAUD_SALT` — fallback ثابت موجود، يُنصح بتعيينه
- **ENV مطلوب:** `SUPER_ADMIN_EMAILS` — قائمة إدارة portal super-admin (comma-separated)
