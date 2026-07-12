import { readFileSync } from 'fs';
const TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = 'exvlolipycabnqiaptib';
const fileBuf = readFileSync('C:/Users/red_w/WorkBuddy/2026-07-08-17-35-06/supabase/functions/llm-chat/index.ts');
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
  console.log('deployed v' + d.version + ' status=' + d.status);
} catch {
  console.log('status:', r.status, t.substring(0, 500));
}
