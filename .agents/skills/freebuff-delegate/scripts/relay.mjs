#!/usr/bin/env node
/**
 * freebuff-delegate · relay.mjs
 * 
 * Connector / Relay bridge to dispatch coding tasks to the Freebuff agent CLI,
 * monitor execution, and return structured diff & verification results to the orchestrator.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    brief: null,
    cd: process.cwd(),
    timeout: 600000, // 10m default
    outDir: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--brief' && args[i + 1]) {
      options.brief = args[++i];
    } else if (arg === '--cd' && args[i + 1]) {
      options.cd = path.resolve(args[++i]);
    } else if (arg === '--timeout' && args[i + 1]) {
      const t = args[++i];
      const match = t.match(/^(\d+)([smh]?)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        options.timeout = unit === 's' ? val * 1000 : unit === 'h' ? val * 3600000 : val * 60000;
      }
    } else if (arg === '--out-dir' && args[i + 1]) {
      options.outDir = path.resolve(args[++i]);
    }
  }

  return options;
}

function findFreebuffBinary() {
  const homeDir = os.homedir();
  const directPath = path.join(homeDir, '.config', 'manicode', 'freebuff.exe');
  if (fs.existsSync(directPath)) return directPath;

  const directNonWin = path.join(homeDir, '.config', 'manicode', 'freebuff');
  if (fs.existsSync(directNonWin)) return directNonWin;

  try {
    const cmd = process.platform === 'win32' ? 'where freebuff' : 'which freebuff';
    const out = execSync(cmd, { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    if (out && fs.existsSync(out)) return out;
  } catch {}

  return null;
}

async function readBrief(briefPath) {
  if (briefPath && fs.existsSync(briefPath)) {
    return fs.readFileSync(briefPath, 'utf8');
  }
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data.trim()));
    setTimeout(() => resolve(data.trim()), 2000);
  });
}

function getGitStatus(cwd) {
  try {
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' }).trim();
    const diff = execSync('git diff', { cwd, encoding: 'utf8' });
    return { status, diff };
  } catch (err) {
    return { status: '', diff: '', error: err.message };
  }
}

async function main() {
  const options = parseArgs();
  const outDir = options.outDir || fs.mkdtempSync(path.join(os.tmpdir(), 'freebuff-relay-'));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const binary = findFreebuffBinary();
  if (!binary) {
    const errResult = {
      status: 'error',
      message: 'Freebuff binary not found. Please ensure freebuff is installed (npm install -g freebuff).'
    };
    fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(errResult, null, 2));
    console.error(JSON.stringify(errResult, null, 2));
    process.exit(1);
  }

  const briefText = await readBrief(options.brief);
  const beforeGit = getGitStatus(options.cd);

  console.log(`[Freebuff Relay] Starting Freebuff agent in: ${options.cd}`);
  console.log(`[Freebuff Relay] Binary: ${binary}`);
  console.log(`[Freebuff Relay] Brief length: ${briefText.length} characters`);

  const spawnArgs = ['--cwd', options.cd, '--trust-agents'];
  const child = spawn(binary, spawnArgs, {
    cwd: options.cd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' }
  });

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (chunk) => {
    const str = chunk.toString();
    stdoutData += str;
    process.stdout.write(str);
  });

  child.stderr.on('data', (chunk) => {
    const str = chunk.toString();
    stderrData += str;
    process.stderr.write(str);
  });

  if (briefText) {
    child.stdin.write(briefText + '\n');
    child.stdin.end();
  }

  const timer = setTimeout(() => {
    console.warn(`[Freebuff Relay] Timeout reached (${options.timeout}ms). Terminating process...`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${child.pid} /T /F`);
      } else {
        child.kill('SIGTERM');
      }
    } catch {}
  }, options.timeout);

  child.on('close', (code, signal) => {
    clearTimeout(timer);
    const afterGit = getGitStatus(options.cd);

    const result = {
      status: code === 0 ? 'completed' : 'exited',
      exitCode: code,
      signal: signal,
      binaryPath: binary,
      targetDir: options.cd,
      gitStatusBefore: beforeGit.status,
      gitStatusAfter: afterGit.status,
      gitDiff: afterGit.diff,
      outputLog: path.join(outDir, 'output.log'),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(path.join(outDir, 'output.log'), stdoutData + '\n' + stderrData);
    fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));

    console.log('\n[Freebuff Relay] Execution finished.');
    console.log(`[Freebuff Relay] Result saved to: ${path.join(outDir, 'result.json')}`);
    console.log(`[Freebuff Relay] Files modified: ${afterGit.status.split('\n').filter(Boolean).length}`);
  });
}

main().catch(err => {
  console.error('[Freebuff Relay] Fatal error:', err);
  process.exit(1);
});
