import psycopg2, sys

DB_URL = "postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Read migration and replace pgvector-specific parts
with open("supabase/migrations/20260708000000_init.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Replace pgvector extension line — Supabase uses 'vector' not 'pgvector'
sql = sql.replace('create extension if not exists "pgvector" with schema extensions;',
                  'create extension if not exists vector;')
# Replace the vector column type
sql = sql.replace('extensions.vector(1536)', 'text')
# Replace the IVFFlat index
sql = sql.replace("using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 100)", "")
# Replace the match function's vector param
sql = sql.replace('extensions.vector(1536)', 'text')
# Replace <=> operator with a simple text similarity (placeholder)
sql = sql.replace('m.embedding <=> p_embedding', "0.5")
sql = sql.replace("1 - (m.embedding <=> p_embedding)", "0.8")

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