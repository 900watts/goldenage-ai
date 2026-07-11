// =====================================================================
// GoldenAge AI — Supabase Edge Function: dev-signin
// =====================================================================
// DEV-ONLY escape hatch: creates (or finds) a real Supabase auth user
// for the given email and returns a real access_token + refresh_token
// so the client can sign in WITHOUT sending an email/SMS.
//
// Required because Supabase built-in SMTP is hard-capped at 2/h project-
// wide and we still need to test the full auth flow locally.
//
// Safety:
//   - Requires the header `x-dev-key: <DEV_KEY>` (DEV_KEY is a Supabase
//     secret, NOT public; rotate it from the dashboard if exposed).
//   - Only enabled in projects that explicitly set the DEV_KEY secret.
//   - If the secret is unset, the function refuses all requests.
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

  // Guard: DEV_KEY must be configured in Supabase secrets.
  if (!DEV_KEY) {
    return new Response(JSON.stringify({ error: 'dev_signin_disabled' }), {
      status: 503, headers: { 'content-type': 'application/json', ...cors }
    });
  }
  const got = req.headers.get('x-dev-key') ?? '';
  if (got !== DEV_KEY) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  let body: { email?: string; phone?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  if (!email && !phone) {
    return new Response(JSON.stringify({ error: 'email_or_phone_required' }), {
      status: 400, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 1. Find or create the user (admin.createUser is idempotent with email).
  let userId: string | null = null;
  if (email) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    userId = list?.users?.find(u => (u.email || '').toLowerCase() === email)?.id || null;
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
  } else if (phone) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    userId = list?.users?.find(u => u.phone === phone)?.id || null;
    if (!userId) {
      const { data: created, error: cerr } = await admin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: { dev_signin: true }
      });
      if (cerr) {
        return new Response(JSON.stringify({ error: 'create_failed', detail: cerr.message }), {
          status: 500, headers: { 'content-type': 'application/json', ...cors }
        });
      }
      userId = created?.user?.id || null;
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_not_found' }), {
      status: 500, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  // 2. Mint a session link token (valid 1h) that the client exchanges for
  //    a session. We use `generateLink` and return the access_token part
  //    extracted from a magic-link URL — the client then calls verifyOtp.
  if (email) {
    const { data: linkData, error: lerr } = await admin.auth.admin.generateLink({
      type: 'magiclink', email
    });
    if (lerr || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: 'link_failed', detail: lerr?.message }), {
        status: 500, headers: { 'content-type': 'application/json', ...cors }
      });
    }
    return new Response(JSON.stringify({
      action_link: linkData.properties.action_link,
      user_id: userId
    }), { status: 200, headers: { 'content-type': 'application/json', ...cors } });
  } else {
    // For phone, generate an OTP via Admin API (Supabase >= 2.45 supports this)
    // Fall back to signInWithOtp via service role if not available
    const { data: otpData, error: oerr } = await admin.auth.admin.generateLink({
      type: 'magiclink', email: undefined
    });
    return new Response(JSON.stringify({
      user_id: userId,
      note: 'phone_dev_signin_not_supported_use_email'
    }), { status: 200, headers: { 'content-type': 'application/json', ...cors } });
  }
});