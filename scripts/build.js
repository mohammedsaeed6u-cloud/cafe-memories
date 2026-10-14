const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// When building on Cloudflare Pages (CF_PAGES=1) or with STATIC_EXPORT=1,
// run the export pipeline to generate the 'out' directory expected by wrangler.jsonc.
if (process.env.CF_PAGES === '1' || process.env.STATIC_EXPORT === '1') {
  console.log('[build.js] Cloudflare Pages environment detected. Running static export pipeline...');
  require('./build-export.js');
} else {
  console.log('[build.js] Running standard Next.js build...');
  execSync('npx next build', { cwd: rootDir, stdio: 'inherit' });
}
