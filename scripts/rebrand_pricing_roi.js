const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const componentsDir = path.join(rootDir, 'src/features/marketing/components');

// 1. AtelierRoiCalculator.tsx
const roiPath = path.join(componentsDir, 'AtelierRoiCalculator.tsx');
let roiCode = fs.readFileSync(roiPath, 'utf-8');
roiCode = roiCode.replace(/#DD0200/g, '#DFAB56');
roiCode = roiCode.replace(/#55100D/g, '#3D2314');
roiCode = roiCode.replace(/ROI & RETENTION CALCULATOR • حاسبة العائد/g, 'STAMPY ROI • حاسبة العائد والاحتفاظ الذكية');
roiCode = roiCode.replace(/text-\[#FBF9F5\]/g, 'text-[#FAF5EB]');
roiCode = roiCode.replace(/text-\[#A19E9B\]/g, 'text-stone-300');
roiCode = roiCode.replace(/bg-\[#141212\]/g, 'bg-[#181513]');
fs.writeFileSync(roiPath, roiCode, 'utf-8');
console.log('✓ AtelierRoiCalculator.tsx rebranded with Stampy Gold & Espresso');

// 2. MarketingPricing.tsx
const pricingPath = path.join(componentsDir, 'MarketingPricing.tsx');
let pricingCode = fs.readFileSync(pricingPath, 'utf-8');
pricingCode = pricingCode.replace(/#DD0200/g, '#DFAB56');
pricingCode = pricingCode.replace(/#55100D/g, '#3D2314');
pricingCode = pricingCode.replace(/bg-\[#DFAB56\] text-white/g, 'bg-[#DFAB56] text-[#12100E]');
pricingCode = pricingCode.replace(/text-\[#A19E9B\]/g, 'text-stone-300');
pricingCode = pricingCode.replace(/bg-\[#141212\]/g, 'bg-[#181513]');
fs.writeFileSync(pricingPath, pricingCode, 'utf-8');
console.log('✓ MarketingPricing.tsx rebranded with Stampy Gold & Espresso');

// 3. MarketingVisualSteps.tsx
const stepsPath = path.join(componentsDir, 'MarketingVisualSteps.tsx');
if (fs.existsSync(stepsPath)) {
  let stepsCode = fs.readFileSync(stepsPath, 'utf-8');
  stepsCode = stepsCode.replace(/#DD0200/g, '#DFAB56');
  stepsCode = stepsCode.replace(/#55100D/g, '#3D2314');
  fs.writeFileSync(stepsPath, stepsCode, 'utf-8');
  console.log('✓ MarketingVisualSteps.tsx rebranded');
}

// 4. MarketingRetentionLoop.tsx
const loopPath = path.join(componentsDir, 'MarketingRetentionLoop.tsx');
if (fs.existsSync(loopPath)) {
  let loopCode = fs.readFileSync(loopPath, 'utf-8');
  loopCode = loopCode.replace(/#DD0200/g, '#DFAB56');
  loopCode = loopCode.replace(/#55100D/g, '#3D2314');
  fs.writeFileSync(loopPath, loopCode, 'utf-8');
  console.log('✓ MarketingRetentionLoop.tsx rebranded');
}

// 5. MarketingWallSection.tsx
const wallPath = path.join(componentsDir, 'MarketingWallSection.tsx');
if (fs.existsSync(wallPath)) {
  let wallCode = fs.readFileSync(wallPath, 'utf-8');
  wallCode = wallCode.replace(/#DD0200/g, '#DFAB56');
  wallCode = wallCode.replace(/#55100D/g, '#3D2314');
  fs.writeFileSync(wallPath, wallCode, 'utf-8');
  console.log('✓ MarketingWallSection.tsx rebranded');
}

// 6. MarketingFaq.tsx
const faqPath = path.join(componentsDir, 'MarketingFaq.tsx');
if (fs.existsSync(faqPath)) {
  let faqCode = fs.readFileSync(faqPath, 'utf-8');
  faqCode = faqCode.replace(/#DD0200/g, '#DFAB56');
  faqCode = faqCode.replace(/#55100D/g, '#3D2314');
  fs.writeFileSync(faqPath, faqCode, 'utf-8');
  console.log('✓ MarketingFaq.tsx rebranded');
}

