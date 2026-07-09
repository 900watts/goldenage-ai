import urllib.request, json, ssl
project = 'exvlolipycabnqiaptib'
token = 'sbp_v0_1cc6eb4b248ee566397f7a83cbf8e3bdae6f7b60'
with open('supabase/migrations/20260708000000_init.sql','r',encoding='utf-8') as f:
    sql = f.read()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Try the supabase.com SQL endpoint (newer API)
req = urllib.request.Request(
    f'https://api.supabase.com/v1/projects/{project}/sql',
    data=sql.encode('utf-8'),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/sql'},
    method='POST'
)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        print('STATUS:', r.status, r.read().decode('utf-8')[:500])
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.read().decode('utf-8')[:2000])
except Exception as e:
    print('Error:', str(e))
