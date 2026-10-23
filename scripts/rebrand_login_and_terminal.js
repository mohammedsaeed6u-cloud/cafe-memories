const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update src/app/(auth)/login/page.tsx
const loginPath = path.join(rootDir, 'src/app/(auth)/login/page.tsx');
let loginCode = fs.readFileSync(loginPath, 'utf-8');

// Replace imports and branding
loginCode = loginCode.replace(
  "import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';",
  "import { StampyLogo, StampyApertureIcon } from '@/components/brand/StampyLogo';\nimport { SlidingRateLimiter } from '@/lib/services/sliding-rate-limiter.service';"
);

// Inject SlidingRateLimiter in handlePinAuth
loginCode = loginCode.replace(
  `      const result = await verifyPinOnly(pin);

      if (!result.success) {
        setErrorMsg(result.error || 'الرمز السري غير صحيح.');
        setLoading(false);
        return;
      }`,
  `      const limit = SlidingRateLimiter.check('login_pin_rate', 5, 15 * 60 * 1000);
      if (!limit.allowed) {
        setErrorMsg('تم قفل محاولات إدخال الرمز مؤقتاً لمدة 15 دقيقة بعد 5 محاولات خاطئة لمنع التخمين (Anti-Brute-Force Guard).');
        setLoading(false);
        return;
      }

      const result = await verifyPinOnly(pin);

      if (!result.success) {
        const failRecord = SlidingRateLimiter.recordFailedPinAttempt('login_device');
        if (failRecord.locked) {
          setErrorMsg('تم قفل محاولات إدخال الرمز مؤقتاً بعد 5 محاولات خاطئة لمنع التخمين.');
        } else {
          setErrorMsg(\`\${result.error || 'الرمز السري غير صحيح.'} (المحاولات المتبقية: \${failRecord.remainingAttempts})\`);
        }
        setLoading(false);
        return;
      }

      SlidingRateLimiter.resetPinAttempts('login_device');`
);

// Replace header with StampyLogo
loginCode = loginCode.replace(
  `<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-red-950/60 border border-white/20">
            <MemoriesArchIcon size={30} color="#FBF9F5" />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
          >
            memories studio
          </h1>`,
  `<div className="mb-4 flex justify-center">
            <StampyLogo size="lg" showTagline={true} />
          </div>`
);

// Colors
loginCode = loginCode.replace(/#DD0200/g, '#DFAB56');
loginCode = loginCode.replace(/#55100D/g, '#3D2314');
loginCode = loginCode.replace(/text-\[#FBF9F5\]/g, 'text-[#FAF5EB]');
loginCode = loginCode.replace(/text-\[#A19E9B\]/g, 'text-stone-300');
loginCode = loginCode.replace(/bg-\[#141212\]/g, 'bg-[#181513]');
loginCode = loginCode.replace(/bg-\[#141313\]/g, 'bg-[#12100E]');
loginCode = loginCode.replace(/selection:bg-\[#DFAB56\]/g, 'selection:bg-[#DFAB56] selection:text-[#12100E]');

fs.writeFileSync(loginPath, loginCode, 'utf-8');
console.log('✓ login/page.tsx rebranded with StampyLogo & Anti-Brute-Force Rate Limiter');

// 2. Update src/app/(merchant)/terminal/page.tsx
const terminalPath = path.join(rootDir, 'src/app/(merchant)/terminal/page.tsx');
let terminalCode = fs.readFileSync(terminalPath, 'utf-8');

terminalCode = terminalCode.replace(
  "import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';",
  "import { StampyLogo, StampyApertureIcon } from '@/components/brand/StampyLogo';"
);
terminalCode = terminalCode.replace(
  `<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-lg shadow-red-950/50 border border-white/20 shrink-0">
              <MemoriesArchIcon size={20} color="#FBF9F5" />
            </div>`,
  `<div className="shrink-0">
              <StampyApertureIcon size={28} />
            </div>`
);
terminalCode = terminalCode.replace(/#DD0200/g, '#DFAB56');
terminalCode = terminalCode.replace(/#55100D/g, '#3D2314');
terminalCode = terminalCode.replace(/bg-\[#DFAB56\] text-white/g, 'bg-[#DFAB56] text-[#12100E]');
terminalCode = terminalCode.replace(/'memories'/g, "'stampy'");
terminalCode = terminalCode.replace(/text-\[#FBF9F5\]/g, 'text-[#FAF5EB]');
terminalCode = terminalCode.replace(/bg-\[#141313\]/g, 'bg-[#12100E]');

fs.writeFileSync(terminalPath, terminalCode, 'utf-8');
console.log('✓ terminal/page.tsx rebranded with Stampy');

