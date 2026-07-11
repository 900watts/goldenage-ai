// =====================================================================
// GoldenAge AI — Supabase Edge Function: dev-signin
// =====================================================================
// DEV-ONLY escape hatch: creates (or finds) a real Supabase auth user
// and returns access_token + refresh_token directly, so the client can
// sign in WITHOUT sending an email/SMS.
//
// Required because Supabase built-in SMTP is hard-capped at 2/h project-
// wide and we still need to test the full auth flow locally.
//
// Safety:
//   - Requires the header `x-dev-key: <DEV_KEY>` (DEV_KEY is a Supabase
//     secret). If the secret is unset, the function refuses all requests.
//   - This is for DEV environments. In production, set DEV_SIGNIN_KEY to
//     an empty string or remove this function entirely.
// =====================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEV_KEY = Deno.env.get('DEV_SIGNIN_KEY') ?? '';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, x-dev-key, content-type',
  'access-control-allow-methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (!DEV_KEY) {
    return new Response(JSON.stringify({ error: 'dev_signin_disabled' }), {
      status: 503, headers: { 'content-type': 'application/json', ...cors }
    });
  }
  if (req.headers.get('x-dev-key') !== DEV_KEY) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  let body: { email?: string; phone?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }
  const email = (body.email || '').trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: 'email_required' }), {
      status: 400, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 1. Find or create the user.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let userId: string | null = list?.users?.find((u: any) => (u.email || '').toLowerCase() === email)?.id || null;
  if (!userId) {
    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { dev_signin: true }
    });
    if (cerr) {
      return new Response(JSON.stringify({ error: 'create_failed', detail: cerr.message }), {
        status: 500, headers: { 'content-type': 'application/json', ...cors }
      });
    }
    userId = created?.user?.id || null;
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_not_found' }), {
      status: 500, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  // 2. Mint a magic-link action_link, follow its 303 redirect server-side,
  //    and extract the access_token + refresh_token from the redirect URL.
  //    (Supabase's verify endpoint returns a 303 to a URL like:
  //     <redirect_to>#access_token=...&refresh_token=...&...)
  //    This avoids the client having to navigate at all, AND avoids the
  //    hard-coded redirect_to that admin.generateLink defaults to.
  const { data: linkData, error: lerr } = await admin.auth.admin.generateLink({
    type: 'magiclink', email
  });
  if (lerr || !linkData?.properties?.action_link) {
    return new Response(JSON.stringify({ error: 'link_failed', detail: lerr?.message }), {
      status: 500, headers: { 'content-type': 'application/json', ...cors }
    });
  }
  const actionLink: string = linkData.properties.action_link;

  // 3. Fetch the action link with manual redirect handling. The verify
  //    endpoint returns 303 with a Location header containing the tokens
  //    in the URL fragment.
  const verifyRes = await fetch(actionLink, { redirect: 'manual' });
  const location = verifyRes.headers.get('location') || '';
  // Extract tokens from the fragment (#access_token=...&refresh_token=...)
  const hashIdx = location.indexOf('#');
  if (hashIdx < 0) {
    return new Response(JSON.stringify({
      error: 'no_tokens_in_redirect',
      status: verifyRes.status,
      location: location.substring(0, 200)
    }), { status: 500, headers: { 'content-type': 'application/json', ...cors } });
  }
  const frag = location.substring(hashIdx + 1);
  const params = new URLSearchParams(frag);
  const access_token = params.get('access_token') || '';
  const refresh_token = params.get('refresh_token') || '';
  const expires_in = parseInt(params.get('expires_in') || '3600', 10);
  const token_type = params.get('token_type') || 'bearer';

  if (!access_token || !refresh_token) {
    return new Response(JSON.stringify({
      error: 'tokens_missing',
      keys: Array.from(params.keys())
    }), { status: 500, headers: { 'content-type': 'application/json', ...cors } });
  }

  return new Response(JSON.stringify({
    access_token,
    refresh_token,
    expires_in,
    token_type,
    user_id: userId,
    email
  }), { status: 200, headers: { 'content-type': 'application/json', ...cors } });
});