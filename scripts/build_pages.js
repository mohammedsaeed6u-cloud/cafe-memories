const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const apiPath = path.join(root, 'src', 'app', 'api');
const apiTemp = path.join(root, 'src', '_backend_api_store');

const goPath = path.join(root, 'src', 'app', 'go');
const goTemp = path.join(root, 'src', '_backend_go_store');

// Pre-flight check: ensure clean state in case of interrupted builds
if (fs.existsSync(apiTemp) && !fs.existsSync(apiPath)) {
  fs.renameSync(apiTemp, apiPath);
}
if (fs.existsSync(goTemp) && !fs.existsSync(goPath)) {
  fs.renameSync(goTemp, goPath);
}

console.log('🚀 [Cloudflare Pages] Step 1: Isolating server routes for static export...');

try {
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, apiTemp);
  }
  if (fs.existsSync(goPath)) {
    fs.renameSync(goPath, goTemp);
  }

  console.log('🔨 [Cloudflare Pages] Step 2: Compiling static export to out/...');
  execSync('npx next build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1' },
  });
  console.log('✨ [Cloudflare Pages] Step 2: Succeeded! out/ generated successfully.');

} finally {
  console.log('🔄 [Cloudflare Pages] Step 3: Restoring server routes...');
  if (fs.existsSync(apiTemp)) {
    if (fs.existsSync(apiPath)) {
      fs.rmSync(apiTemp, { recursive: true, force: true });
    } else {
      fs.renameSync(apiTemp, apiPath);
    }
  }
  if (fs.existsSync(goTemp)) {
    if (fs.existsSync(goPath)) {
      fs.rmSync(goTemp, { recursive: true, force: true });
    } else {
      fs.renameSync(goTemp, goPath);
    }
  }
  console.log('✓ [Cloudflare Pages] Step 3: Server routes fully restored.');
}
