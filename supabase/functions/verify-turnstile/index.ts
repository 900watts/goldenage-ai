// =====================================================================
// GoldenAge AI — Supabase Edge Function: verify-turnstile
// =====================================================================
// File path: supabase/functions/verify-turnstile/index.ts
// Deploy with:  supabase functions deploy verify-turnstile
//
// Client-side Turnstile widget (invisible mode) returns a one-shot token.
// The browser POSTs that token to this function, which forwards it to
// Cloudflare's siteverify endpoint along with the secret key stored in the
// Supabase project secrets (TURNSTILE_SECRET).
//
// We return a normalized shape:
//   { ok: true,  hostname, action, cdata, ts }   on success
//   { ok: false, error: '...', ts }              on failure
//
// The function is intentionally minimal — no auth required, because the
// client widget itself is the proof. Cloudflare is the source of truth.
//
// Rate limit: short-lived in-process cache (5 min) so a token can be
// re-submitted by a retry without burning a Cloudflare validation, and to
// blunt any accidental token-replay. Tokens are single-use on Cloudflare
// side anyway.
// =====================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET') ?? '';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 min

// In-process token cache. In-memory means it doesn't survive cold starts,
// which is fine — a cold start just forces a re-verify (Cloudflare still
// rejects reused tokens, so this never grants a fake pass).
const seen = new Map<string, { ok: boolean; exp: number; hostname?: string }>();

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, apikey',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

function remember(token: string, ok: boolean, hostname?: string) {
  seen.set(token, { ok, exp: Date.now() + CACHE_TTL_MS, hostname });
  // opportunistic GC so the map doesn't grow forever
  if (seen.size > 5000) {
    const now = Date.now();
    for (const [k, v] of seen) if (v.exp < now) seen.delete(k);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  if (!TURNSTILE_SECRET) {
    return jsonResponse({ ok: false, error: 'TURNSTILE_SECRET not configured' }, 500);
  }

  let body: { token?: string; remoteip?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const token = (body?.token || '').toString().trim();
  if (!token) {
    return jsonResponse({ ok: false, error: 'missing_token' }, 400);
  }

  // Cache hit (re-submit of the same token within the window).
  const cached = seen.get(token);
  if (cached && cached.exp > Date.now()) {
    if (!cached.ok) return jsonResponse({ ok: false, error: 'cached_fail', ts: Date.now() }, 403);
    return jsonResponse({ ok: true, cached: true, ts: Date.now() });
  }

  // Forward to Cloudflare siteverify.
  const form = new URLSearchParams();
  form.set('secret', TURNSTILE_SECRET);
  form.set('response', token);
  if (body?.remoteip) form.set('remoteip', body.remoteip);

  let r: Response;
  try {
    r = await fetch(VERIFY_URL, { method: 'POST', body: form });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'siteverify_unreachable', detail: String(e) }, 502);
  }

  let j: { success?: boolean; 'error-codes'?: string[]; hostname?: string; action?: string; cdata?: string };
  try {
    j = await r.json();
  } catch {
    return jsonResponse({ ok: false, error: 'siteverify_bad_json' }, 502);
  }

  const ok = !!j.success;
  remember(token, ok, j.hostname);

  if (!ok) {
    return jsonResponse({
      ok: false,
      error: 'turnstile_rejected',
      codes: j['error-codes'] || [],
      ts: Date.now(),
    }, 403);
  }
  return jsonResponse({
    ok: true,
    hostname: j.hostname,
    action: j.action,
    cdata: j.cdata,
    ts: Date.now(),
  });
});
