import { readFileSync } from 'fs';
const TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = 'exvlolipycabnqiaptib';
const sql = readFileSync('C:/Users/red_w/WorkBuddy/2026-07-08-17-35-06/supabase/migrations/20260712000002_ai_agents.sql', 'utf8');
const r = await fetch('https://api.supabase.com/v1/projects/' + PROJECT_REF + '/database/query', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql })
});
const text = await r.text();
console.log('status:', r.status);
console.log(text.substring(0, 3000));
