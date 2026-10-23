const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

function walk(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walk(srcDir);
let modifiedCount = 0;

for (const filePath of allFiles) {
  // Skip tests or brand definitions
  if (filePath.includes('StampyLogo.tsx')) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Color token replacements to Stampy Gold Ochre & Deep Espresso
  content = content.replace(/#DD0200/g, '#DFAB56');
  content = content.replace(/#B50200/g, '#C99645');
  content = content.replace(/#55100D/g, '#3D2314');
  content = content.replace(/#FBF9F5/g, '#FAF5EB');

  // 2. High contrast button text fix (black text on gold background)
  content = content.replace(/bg-\[#DFAB56\](.*?)text-\[#FAF5EB\]/g, 'bg-[#DFAB56]$1text-[#12100E]');
  content = content.replace(/bg-\[#DFAB56\](.*?)text-white/g, 'bg-[#DFAB56]$1text-[#12100E]');

  // 3. Brand name updates
  content = content.replace(/memories studio/gi, 'stampy.');
  content = content.replace(/ATELIER NOSTALGIA/g, 'STAMPY BRAND SYSTEM');
  content = content.replace(/Atelier Nostalgia/g, 'استامبي • Stampy');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`✓ Rebranded ${modifiedCount} files across src/ with Stampy visual identity and color tokens!`);

