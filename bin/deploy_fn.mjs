import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// --- Load .env (Node does NOT auto-load it) so SUPABASE_MGMT_TOKEN is available.
function loadEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = join(here, '..', '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv();

const TOKEN = process.env.SUPABASE_MGMT_TOKEN;
if (!TOKEN || TOKEN.startsWith('ROTATE_ME')) {
  console.error('ERROR: SUPABASE_MGMT_TOKEN is missing or still a placeholder in .env.');
  console.error('Set it to a real token from https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const PROJECT_REF = 'exvlolipycabnqiaptib';
const FN_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'functions', 'llm-chat', 'index.ts');
const fileBuf = readFileSync(FN_PATH);
const boundary = '----FormBoundary' + Date.now();
const metadata = JSON.stringify({ entrypoint_path: 'index.ts', name: 'llm-chat', verify_jwt: false });
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="metadata"\r\n\r\n';
body += metadata + '\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="file"; filename="index.ts"\r\n';
body += 'Content-Type: application/typescript\r\n\r\n';
body += fileBuf.toString('utf8') + '\r\n';
body += '--' + boundary + '--\r\n';
const r = await fetch('https://api.supabase.com/v1/projects/' + PROJECT_REF + '/functions/deploy?slug=llm-chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
  body
});
const t = await r.text();
try {
  const d = JSON.parse(t);
  if (d.version) {
    console.log('deployed v' + d.version + ' status=' + d.status);
  } else {
    console.error('deploy returned unexpected body:', t.substring(0, 500));
    process.exit(1);
  }
} catch {
  console.error('deploy failed (HTTP ' + r.status + '):', t.substring(0, 500));
  process.exit(1);
}
