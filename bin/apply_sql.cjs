const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({
  connectionString: 'postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const file = process.argv[2];
  const sql = fs.readFileSync(path.resolve(file), 'utf8');
  console.log('applying', file, '(' + sql.length + ' bytes)');
  await pool.query(sql);
  console.log('OK');
  await pool.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });