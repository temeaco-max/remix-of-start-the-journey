/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Quick-start helper for local development.
 *
 * Guarantees, on every invocation:
 *   1. dist/ is wiped so no stale pre-unified-IA build artifacts are
 *      served in production mode. (public/ is the source static
 *      directory tracked in git, not a build output, so it must not be
 *      removed.)
 *   2. NODE_ENV=development is set so the server runs in dev mode (avoids
 *      tsx hardcoding NODE_ENV=production at the top of the process).
 *   3. If port 3000 is already in use, the previous listener is terminated
 *      before a new server is launched.
 *
 * Usage:
 *   node scripts/dev-start.mjs            # tsx (type-stripped) on port 3000
 *   PORT=4000 node scripts/dev-start.mjs  # override the port
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Use process.cwd() as the stable anchor.  import.meta.url can behave
// unexpectedly when the script is invoked from sub-shell npm wrappers.
const ROOT = process.cwd();
const PORT = String(process.env.PORT || '3000');
const HOST = String(process.env.HOST || '0.0.0.0');

function log(message) { console.log(`[dev-start] ${message}`); }

function wipeBuildArtifacts() {
  // Only wipe build output (dist/).  public/ is the source static
  // directory tracked in git; removing it would delete chat/index.html
  // and the entire CSS bundle that the live server needs to serve.
  for (const dir of ['dist']) {
    const target = path.join(ROOT, dir);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      log(`wiped ${dir}/`);
    }
  }
}

function freePort() {
  // Best-effort: find and kill any process listening on PORT.
  try {
    const result = spawnSync('lsof', ['-ti', `:${PORT}`], { encoding: 'utf8' });
    const pids = (result.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (pids.length === 0) return;
    for (const pid of pids) {
      try {
        log(`killing stale listener on :${PORT} (pid ${pid})`);
        process.kill(Number(pid), 'SIGTERM');
      } catch { /* already gone */ }
    }
    // Give it a moment to release the port.
    spawnSync('sleep', ['1']);
  } catch (err) {
    log(`port probe failed (continuing): ${err.message}`);
  }
}

function start() {
  wipeBuildArtifacts();
  freePort();

  const tsxBin = path.join(ROOT, 'node_modules', '.bin', 'tsx');
  if (!existsSync(tsxBin)) {
    log('tsx not installed. Run `npm install --include=dev` first.');
    process.exit(1);
  }

  // Use `node` to execute the .bin/tsx symlink; on some macOS shells the
  // direct script invocation can fail with EACCES even when the file is
  // readable, so we always go through node.
  const tsxArgs = [tsxBin, 'index.ts'];

  const env = {
    ...process.env,
    NODE_ENV: 'development',
    PORT,
    HOST,
  };

  log(`starting: NODE_ENV=development node ${tsxBin} index.ts (port ${PORT})`);
  const child = spawn(process.execPath, tsxArgs, { cwd: ROOT, env, stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

start();
