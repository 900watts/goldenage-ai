import psycopg2, sys, re

dsn = "postgresql://postgres.exvlolipycabnqiaptib:GoldenAge2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\supabase\migrations\20260708000000_init.sql','r',encoding='utf-8') as f:
    sql = f.read()

# Remove pgvector and pg_trgm
sql = re.sub(r'create extension if not exists "pgvector".*', '', sql)
sql = re.sub(r'create extension if not exists "pg_trgm".*', '', sql)
# Remove the entire memory_embeddings section
m_start = sql.find('3. MEMORY EMBEDDINGS')
m_end = sql.find('$$;', m_start) + 3
if m_start >= 0 and m_end > m_start:
    sql = sql[:m_start] + sql[m_end:]

# Add IF NOT EXISTS to create table and create index
sql = re.sub(r'create table public\.(\w+) \(', r'create table if not exists public.\1 (', sql)
sql = re.sub(r'create index (\w+)', r'create index if not exists \1', sql)
# CREATE TRIGGER does not support IF NOT EXISTS in standard Postgres, but OR REPLACE on functions works
# Drop trigger first then create
# Replace the trigger definition with drop+create
sql = re.sub(
    r'create trigger (on_auth_user_created)\s*\n\s*after insert on auth\.users\s*\n\s*for each row execute function public\.handle_new_user\(\);',
    r'drop trigger if exists \1 on auth.users;\ncreate trigger \1\n  after insert on auth.users\n  for each row execute function public.handle_new_user();',
    sql,
    flags=re.IGNORECASE
)

try:
    conn = psycopg2.connect(dsn, connect_timeout=15)
    conn.autocommit = True
    cur = conn.cursor()
    for stmt in [
        'drop table if exists public.memory_embeddings cascade;',
        'drop function if exists public.match_user_memory cascade;',
        'drop table if exists public.medication_logs cascade;',
        'drop table if exists public.medication_schedules cascade;',
        'drop table if exists public.guardians cascade;',
        'drop table if exists public.crisis_events cascade;',
        'drop table if exists public.session_logs cascade;',
        'drop table if exists public.user_preferences cascade;',
        'drop table if exists public.profiles cascade;',
        'drop table if exists public.news_bookmarks cascade;',
        'drop table if exists public.scam_reports cascade;',
        'drop table if exists public.finance_watchlist cascade;',
        'drop trigger if exists on_auth_user_created on auth.users;',
        'drop type if exists med_status cascade;',
        'drop type if exists guardian_role cascade;',
        'drop type if exists elder_hearing cascade;',
        'drop type if exists elder_mobility cascade;',
        'drop type if exists crisis_kind cascade;',
        'drop type if exists scam_verdict cascade;',
    ]:
        try: cur.execute(stmt)
        except Exception: pass
    cur.execute(sql)
    print('MIGRATION_OK')
    cur.close()
    conn.close()
except Exception as e:
    print('ERROR:', e, file=sys.stderr)
    sys.exit(1)
