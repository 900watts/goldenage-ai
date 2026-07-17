#!/usr/bin/env node
// Optional health probe for the `llm-chat` Supabase Edge Function.
// Usage (local):  SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/health-check.mjs
//
// The function runs with verify_jwt=false, so the public anon key is enough to
// hit it. If the required env vars are absent the script SKIPs (exit 0) so it is
// safe to run anywhere. This is a developer/ops tool — it is intentionally NOT
// wired into CI to keep the pipeline deterministic and network-independent.

import { spawnSync } from 'node:child_process';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON) {
  console.log('SKIP health-check: SUPABASE_URL / SUPABASE_ANON_KEY not set.');
  process.exit(0);
}

const url = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/llm-chat`;
const payload = { messages: [{ role: 'user', content: 'ping' }], stream: false };

const res = spawnSync(
  'curl',
  [
    '-sS', '-m', '20', '-o', '/dev/null', '-w', '%{http_code}',
    '-X', 'POST', url,
    '-H', `Authorization: Bearer ${ANON}`,
    '-H', `apikey: ${ANON}`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify(payload),
  ],
  { encoding: 'utf8' },
);

if (res.status !== 0) {
  console.error('FAIL health-check: curl error');
  if (res.stderr) console.error(res.stderr.trim());
  process.exit(1);
}

const code = (res.stdout || '').trim();
console.log(`llm-chat responded: HTTP ${code}`);
if (!['200', '201'].includes(code)) {
  console.error('FAIL health-check: unexpected status code.');
  process.exit(1);
}
console.log('OK health-check');
