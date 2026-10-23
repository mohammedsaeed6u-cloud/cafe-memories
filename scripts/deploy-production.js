const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const tempApiDir = path.join(rootDir, 'src', 'app', '_api_temp');
const goDir = path.join(rootDir, 'src', 'app', 'go');
const tempGoDir = path.join(rootDir, 'src', 'app', '_go_temp');

console.log('🚀 [1/4] Preparing Next.js static export for Cloudflare Pages...');
let movedApi = false;
let movedGo = false;

if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, tempApiDir);
  movedApi = true;
  console.log('  • Temporarily relocated API routes');
}

if (fs.existsSync(goDir)) {
  fs.renameSync(goDir, tempGoDir);
  movedGo = true;
  console.log('  • Temporarily relocated dynamic redirect routes');
}

try {
  console.log('🔨 [2/4] Compiling static pages via Turbopack...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      STATIC_EXPORT: '1',
    },
  });
  console.log('  ✓ Static compilation finished successfully.');
} finally {
  console.log('🔄 [3/4] Restoring server routes...');
  if (movedApi && fs.existsSync(tempApiDir)) {
    fs.renameSync(tempApiDir, apiDir);
    console.log('  • Restored API routes');
  }
  if (movedGo && fs.existsSync(tempGoDir)) {
    fs.renameSync(tempGoDir, goDir);
    console.log('  • Restored redirect routes');
  }
}

console.log('☁️  [4/4] Deploying to Cloudflare Pages (memories-c9w.pages.dev)...');
try {
  execSync('npx wrangler pages deploy out --project-name=memories --commit-dirty=true', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: '669ea111dc60c0e06c2969fbe95aa21e',
    },
  });
  console.log('✨ Live deployment completed successfully!');
} catch (err) {
  console.error('❌ Cloudflare deployment failed:', err.message);
  process.exit(1);
}
