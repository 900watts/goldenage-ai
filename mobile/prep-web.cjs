// Copies the root web app into mobile/www and swaps the Supabase CDN <script>
// for the locally vendored UMD build, so the APK does not depend on a CDN
// that may be blocked in China (jsdelivr). Run via `npm run prep`.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const www = path.join(__dirname, 'www');
fs.mkdirSync(www, { recursive: true });

// 1) plain script files
for (const f of ['app.js', 'app-live.js']) {
  fs.copyFileSync(path.join(root, f), path.join(www, f));
}

// 1b) agent-souls directory (default soul.md templates)
const soulsSrc = path.join(root, 'assets', 'agent-souls');
const soulsDst = path.join(www, 'agent-souls');
fs.mkdirSync(soulsDst, { recursive: true });
for (const f of fs.readdirSync(soulsSrc)) {
  fs.copyFileSync(path.join(soulsSrc, f), path.join(soulsDst, f));
}

// 2) index.html = app.html with the CDN supabase script replaced by local vendor
let html = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const cdnRe = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/;
if (cdnRe.test(html)) {
  html = html.replace(cdnRe, '<script src="vendor/supabase.js"></script>');
  console.log('  swapped Supabase CDN -> local vendor/supabase.js');
} else {
  console.log('  (Supabase CDN tag not found — left as-is; check app.html)');
}
fs.writeFileSync(path.join(www, 'index.html'), html);

console.log('web assets prepared ->', www);
