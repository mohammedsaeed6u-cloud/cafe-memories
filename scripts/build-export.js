const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiPath = path.join(rootDir, 'src', 'app', 'api');
const backupPath = path.join(rootDir, 'api_routes_backup');
const publicDir = path.join(rootDir, 'public');
const outDir = path.join(rootDir, 'out');

const authCustomerPath = path.join(rootDir, 'src', 'app', 'auth', 'customer');
const authCustomerBackup = path.join(rootDir, 'auth_customer_backup');

console.log('[build-export] Preparing Next.js static export for Cloudflare Pages...');

function safeMove(src, dst) {
  for (let i = 0; i < 5; i++) {
    try {
      fs.renameSync(src, dst);
      return;
    } catch (e) {
      if (i === 4 || (e.code !== 'EPERM' && e.code !== 'EBUSY')) {
        try {
          fs.cpSync(src, dst, { recursive: true });
          fs.rmSync(src, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
          return;
        } catch (copyErr) {
          throw e;
        }
      }
      const wait = Date.now() + 300;
      while (Date.now() < wait) {}
    }
  }
}

let movedApi = false;
let movedAuthCustomer = false;
let buildError = null;
try {
  if (fs.existsSync(apiPath)) {
    safeMove(apiPath, backupPath);
    movedApi = true;
    console.log('[build-export] Moved src/app/api -> api_routes_backup');
  }

  if (fs.existsSync(authCustomerPath)) {
    safeMove(authCustomerPath, authCustomerBackup);
    movedAuthCustomer = true;
    console.log('[build-export] Moved src/app/auth/customer -> auth_customer_backup');
  }

  process.env.STATIC_EXPORT = '1';
  console.log('[build-export] Running next build (STATIC_EXPORT=1)...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1' }
  });

  const headersSrc = path.join(publicDir, '_headers');
  const headersDst = path.join(outDir, '_headers');
  if (fs.existsSync(headersSrc)) {
    fs.copyFileSync(headersSrc, headersDst);
    console.log('[build-export] Copied public/_headers -> out/_headers');
  }

  const redirectsSrc = path.join(publicDir, '_redirects');
  const redirectsDst = path.join(outDir, '_redirects');
  if (fs.existsSync(redirectsSrc)) {
    fs.copyFileSync(redirectsSrc, redirectsDst);
    console.log('[build-export] Copied public/_redirects -> out/_redirects');
  }

  console.log('[build-export] Export build finished successfully!');
} catch (err) {
  console.error('[build-export] Build failed:', err.message);
  buildError = err;
} finally {
  if (movedApi && fs.existsSync(backupPath)) {
    try {
      safeMove(backupPath, apiPath);
      console.log('[build-export] Restored api_routes_backup -> src/app/api');
    } catch (restoreErr) {
      console.error('[build-export] Failed to restore api_routes_backup:', restoreErr.message);
    }
  }
  if (movedAuthCustomer && fs.existsSync(authCustomerBackup)) {
    try {
      safeMove(authCustomerBackup, authCustomerPath);
      console.log('[build-export] Restored auth_customer_backup -> src/app/auth/customer');
    } catch (restoreErr) {
      console.error('[build-export] Failed to restore auth_customer_backup:', restoreErr.message);
    }
  }
  if (buildError) {
    process.exit(1);
  }
}
