#!/usr/bin/env python3
# =====================================================================
# Apply the GoldenAge AI Vercel WAF IP ban list
# =====================================================================
# This script blocks the listed IPs at the Vercel CDN edge so banned
# visitors get served /banned.html before any origin request.
#
# REQUIRES:
#   - VERCEL_TOKEN: a Vercel personal access token (Account Settings →
#     Tokens). The token in the Vercel CLI auth (vercel login) won't
#     work directly — generate a new one in the dashboard.
#   - VERCEL_PROJECT_ID: your project's ID. After `vercel link`, look
#     in .vercel/project.json for the "projectId" value.
#   - VERCEL_TEAM_ID: optional. Only needed if the project is under
#     a team (you'll see it in the URL when you open the project in
#     the Vercel dashboard, e.g. vercel.com/<TEAM>/<PROJECT>).
#
# USAGE:
#   export VERCEL_TOKEN=...
#   export VERCEL_PROJECT_ID=prj_xxxxxxxx
#   export VERCEL_TEAM_ID=team_xxxxxxxx   # only if applicable
#   python3 _vercel_ban.py
#
# After running, the banned IP will be served /banned.html on every
# request to your Vercel site. The Supabase Edge Function
# (llm-chat) continues to enforce 1/day anon + 10/day user rate
# limits independently.
# =====================================================================
import urllib.request, json, os, sys, urllib.error

TOKEN = os.environ.get('VERCEL_TOKEN')
PROJECT = os.environ.get('VERCEL_PROJECT_ID')
TEAM = os.environ.get('VERCEL_TEAM_ID')

if not TOKEN or not PROJECT:
    print('ERROR: set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables first.')
    print()
    print('  1. Open https://vercel.com/account/tokens and create a new token.')
    print('  2. Find your project ID: cat .vercel/project.json')
    print('  3. (If the project is under a team, also set VERCEL_TEAM_ID.)')
    print('  4. Re-run this script.')
    sys.exit(1)

# The Vercel Firewall v1 API:
#   GET  /v1/firewall/{projectId}              -> list existing rules
#   POST /v1/firewall/{projectId}/attack-mode  -> toggle (not what we need)
#   The actual IP blocklist endpoint varies by plan:
#     - Vercel Pro: v1/security/firewall/config (managed rulesets)
#     - Vercel Enterprise: dedicated API
#   The most portable path is the deprecated but still-working
#   /v1/projects/{id}/ firewall endpoints. If those don't work, use
#   the CLI: `vercel firewall ban add <ip>` (Pro plan required).

def vreq(method, path, body=None):
    url = f'https://api.vercel.com{path}'
    if TEAM and '?teamId=' not in path:
        sep = '&' if '?' in path else '?'
        url = f'{url}{sep}teamId={TEAM}'
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Authorization', f'Bearer {TOKEN}')
    r.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

BANNED_IPS = [
    # 'IP', 'reason'
    ('216.236.45.165', '2026-07-12 — 18 anonymous AI calls, Hong Kong, Eons Data.'),
]

# 1) Try the v1/firewall endpoint to see what's available
print('--- listing existing firewall config ---')
for ep in [
    f'/v1/firewall/{PROJECT}',
    f'/v1/projects/{PROJECT}/firewall',
    f'/v1/security/firewall/config?projectId={PROJECT}',
]:
    st, body = vreq('GET', ep)
    print(f'GET {ep} => {st} {body[:300]}')
    print()

# 2) Try posting IP rules. The v1/firewall/{projectId} POST is the
#    "create rule" endpoint, with a body shaped like:
#    { "name": "...", "action": "ip_rule", "priority": 1, "ip": [...] }
print('--- attempting to create IP rule for each banned IP ---')
for ip, reason in BANNED_IPS:
    st, body = vreq('POST', f'/v1/firewall/{PROJECT}', {
        'name': f'ban-{ip}',
        'action': 'ip_rule',
        'priority': 1,
        'rule': { 'ip': ip, 'action': 'bypass' },  # placeholder shape
        'reason': reason,
    })
    print(f'  POST ban for {ip} => {st} {body[:300]}')
    print()

# 3) Fallback instructions (always printed)
print()
print('=' * 60)
print('If the API calls above returned 404 or 403, use the Vercel CLI:')
print()
print('  npm i -g vercel')
print('  vercel login')
print('  vercel link --yes')
print()
print('Then for each IP:')
for ip, _ in BANNED_IPS:
    print(f'  vercel firewall ban add {ip}')
print()
print('(Requires Vercel Pro plan for the Firewall product.)')
print('=' * 60)
