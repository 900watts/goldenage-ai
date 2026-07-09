import psycopg2, sys
dsn = "postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\supabase\migrations\20260708000000_init.sql','r',encoding='utf-8') as f:
    sql = f.read()
try:
    conn = psycopg2.connect(dsn, connect_timeout=15)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print('MIGRATION_OK')
    cur.close()
    conn.close()
except Exception as e:
    print('ERROR:', e, file=sys.stderr)
    sys.exit(1)
