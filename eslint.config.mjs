import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Layering guardrails.
 *
 * The codebase follows a features/layers split (constants → services → hooks
 * → components). These rules keep files from silently re-absorbing logic:
 * components stay compositional, data tables live in lib/constants, and any
 * file that grows past the budget needs an explicit refactor or opt-out.
 */
const MAX_LINES = 600;

/**
 * Legacy files already over the line budget at the time the rule was
 * introduced. They report as warnings (visible debt) instead of errors so
 * day-to-day lint stays green; shrink this list over time by splitting the
 * files into their layers. New files can never be added here.
 */
const LEGACY_LINE_DEBT = [
  "src/app/(merchant)/terminal/page.tsx",
  "src/components/customer/CustomerClient.tsx",
  "src/components/dashboard/DashboardSettingsTab.tsx",
  "src/components/dashboard/DashboardWalletCommandCenter.tsx",
  "src/components/dashboard/FrameStudioTab.tsx",
  "src/components/dashboard/LoyaltyStudioTab.tsx",
  "src/components/dashboard/SubscriptionBillingTab.tsx",
  "src/components/loyalty/LoyaltyCardView.tsx",
  "src/components/photobooth/PhotoboothStripCard.tsx",
  "src/components/wall/WallClient.tsx",
  "src/lib/constants/photobooth-presets.ts",
  "src/lib/services/digital-wallet.service.ts",
  "src/lib/services/print.service.ts",
  "src/lib/services/strip-composer.service.ts",
];

const maxLinesOptions = {
  max: MAX_LINES,
  skipBlankLines: true,
  skipComments: true,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Hard limit for everything: any new file past the budget fails lint.
  {
    rules: {
      "max-lines": ["error", maxLinesOptions],
    },
  },
  // Grandfathered debt: same limit, but only a warning until refactored.
  {
    files: LEGACY_LINE_DEBT,
    rules: {
      "max-lines": ["warn", maxLinesOptions],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
