import psycopg2, sys

DB_URL = "postgresql://postgres:GoldenAge2026!@db.exvlolipycabnqiaptib.supabase.co:5432/postgres"

with open("supabase/migrations/20260708000000_init.sql", "r", encoding="utf-8") as f:
    sql = f.read()

try:
    conn = psycopg2.connect(DB_URL, connect_timeout=15)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print("MIGRATION_OK")
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)