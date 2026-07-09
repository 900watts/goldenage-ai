import psycopg2
dsn = "postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(dsn, connect_timeout=10)
cur = conn.cursor()
# List all tables in public schema
cur.execute("""SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name""")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)
# Check medication_schedules columns
cur.execute("""SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='medication_schedules' ORDER BY ordinal_position""")
print()
print('medication_schedules columns:')
for c, t in cur.fetchall(): print('  ', c, t)
print()
cur.execute("""SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position""")
print('profiles columns:')
for c, t in cur.fetchall(): print('  ', c, t)
conn.close()
