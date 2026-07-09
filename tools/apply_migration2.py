import psycopg2, ssl, sys

# Try pooler connection (port 6543) with SSL
DB_URL = "postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

with open("supabase/migrations/20260708000000_init.sql", "r", encoding="utf-8") as f:
    sql = f.read()

try:
    conn = psycopg2.connect(DB_URL, connect_timeout=20, sslmode='require')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print("MIGRATION_OK")
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
