#!/usr/bin/env node
// Client-JS syntax gate for GoldenAge AI.
// Runs `node --check` against every browser/client script in the repo so a
// broken JS file can never reach Vercel via the auto-deploy from `main`.
//
// Each target is copied to a throwaway .mjs in a temp dir before checking:
// `node --check` parses .mjs as an ES module, which tolerates BOTH ESM
// (import/export) and CommonJS-style globals (require/exports/module are just
// undefined references at parse time, not syntax errors). This makes the check
// robust regardless of how a given file is authored.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const targets = [
  'app.js',
  'app-live.js',
  'mobile/www/app.js',
  'mobile/www/app-live.js',
];

const nodeBin = process.execPath;
let failures = 0;

const tmp = mkdtempSync(join(tmpdir(), 'goldenage-smoke-'));
try {
  for (const rel of targets) {
    if (!existsSync(rel)) {
      console.warn(`SKIP ${rel} (not found)`);
      continue;
    }
    const src = readFileSync(rel, 'utf8');
    const tmpFile = join(tmp, rel.replace(/[\/\\]/g, '__') + '.mjs');
    writeFileSync(tmpFile, src);
    const res = spawnSync(nodeBin, ['--check', tmpFile], { encoding: 'utf8' });
    if (res.status === 0) {
      console.log(`OK   ${rel}`);
    } else {
      failures++;
      console.error(`FAIL ${rel}`);
      console.error((res.stderr || res.stdout || '').trim());
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} file(s) failed the syntax check.`);
  process.exit(1);
}
console.log('\nAll client JS files passed the syntax check.');
