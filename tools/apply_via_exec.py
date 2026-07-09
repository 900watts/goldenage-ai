import urllib.request, json
# Use the Supabase /pg/query endpoint via REST management API
project = 'exvlolipycabnqiaptib'
token = 'sbp_v0_1cc6eb4b248ee566397f7a83cbf8e3bdae6f7b60'

# Read migration
with open('supabase/migrations/20260708000000_init.sql','r',encoding='utf-8') as f:
    sql = f.read()

# Use the project's SQL execution endpoint via the pg-meta API
# First get the database connection string
import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    f'https://api.supabase.com/v1/projects/{project}/database/query',
    data=json.dumps({'query': sql}).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    },
    method='POST'
)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        body = r.read().decode('utf-8')
        print('STATUS:', r.status)
        print('BODY:', body[:2000])
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.read().decode('utf-8')[:2000])
except Exception as e:
    print('Error:', str(e))
