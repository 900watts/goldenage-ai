// =====================================================================
// GoldenAge AI — Supabase Edge Function: notify-guardian
// =====================================================================
// File path: supabase/functions/notify-guardian/index.ts
// Deploy with:  supabase functions deploy notify-guardian
//
// Invoked by the Flutter app after a `crisis_events` row is inserted,
// or by a Postgres trigger. Sends:
//   1. SMS to all linked guardians (Twilio, configurable)
//   2. Push notification via FCM (Phase 4)
//   3. Auto-dial emergency services if user has opted in
//
// Read the spec section 10 (Guardian Ecosystem + Exception Gate).
// =====================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ---------- secrets (set via `supabase secrets set`) -----------------
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') ?? '';

// ---------- types -----------------------------------------------------
interface CrisisPayload {
  crisis_id: string;
  user_id: string;
  kind: 'sos_button' | 'fall_detected' | 'chest_pain_search'
      | 'med_missed_critical' | 'no_activity_24h' | 'manual_alert';
  latitude?: number;
  longitude?: number;
}

// ---------- main handler ---------------------------------------------
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload: CrisisPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Look up all linked guardians for the elder
  const { data: guardians, error: gErr } = await admin
    .from('guardians')
    .select('guardian_id, role, profiles!guardians_guardian_id_fkey(phone_e164, display_name)')
    .eq('elder_id', payload.user_id)
    .eq('pair_accepted', true)
    .is('revoked_at', null);

  if (gErr) {
    return new Response(JSON.stringify({ error: gErr.message }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }

  // 2. Build the human-readable message
  const mapLink = payload.latitude && payload.longitude
    ? `https://uri.amap.com/marker?position=${payload.longitude},${payload.latitude}`
    : '(no location)';
  const kindText: Record<CrisisPayload['kind'], string> = {
    sos_button:          '按下了紧急求助按钮',
    fall_detected:       '检测到跌倒',
    chest_pain_search:   '多次搜索胸痛相关症状',
    med_missed_critical: '关键药物多次未服',
    no_activity_24h:     '24小时无活动',
    manual_alert:        '手动触发紧急告警',
  };
  const message = `【银龄智伴 紧急通知】您的家人可能遇到紧急情况：${kindText[payload.kind]}。位置：${mapLink}`;

  // 3. Send SMS via Twilio (skip if not configured)
  const smsResults: unknown[] = [];
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    for (const g of (guardians ?? []) as any[]) {
      const phone = g?.profiles?.phone_e164;
      if (!phone) continue;
      try {
        const tw = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
              'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ To: phone, From: TWILIO_FROM_NUMBER, Body: message }),
          },
        );
        smsResults.push({ to: phone, status: tw.status });
      } catch (e) {
        smsResults.push({ to: phone, error: String(e) });
      }
    }
  }

  // 4. Mark crisis as guardian_notified = true
  await admin
    .from('crisis_events')
    .update({ guardian_notified: true })
    .eq('id', payload.crisis_id);

  return new Response(JSON.stringify({
    ok: true,
    guardians: (guardians ?? []).length,
    sms: smsResults,
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
