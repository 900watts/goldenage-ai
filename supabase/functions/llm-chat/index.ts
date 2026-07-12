// =====================================================================
// GoldenAge AI — Supabase Edge Function: llm-chat
// =====================================================================
// Server-side LLM proxy. Holds the SiliconFlow API key, enforces a
// per-user daily credits system, and forwards chat completions.
//
// Flow:
//   1. Read user JWT from Authorization header.
//   2. Estimate input token cost; call ai_credits_consume(amount=1)
//      to atomically decrement credits (refused if exhausted).
//   3. Call SiliconFlow chat completions with the user's messages.
//   4. On success: parse the response, settle the credit cost based
//      on the actual output tokens (refund or extra-charge).
//   5. Return { reply, usage, credits_remaining, credits_total, reset_at }.
// =====================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SILICONFLOW_KEY = Deno.env.get('SILICONFLOW_KEY') ?? '';
const SILICONFLOW_URL = Deno.env.get('SILICONFLOW_URL') ?? 'https://api.siliconflow.cn/v1/chat/completions';
const SILICONFLOW_MODEL = Deno.env.get('SILICONFLOW_MODEL') ?? 'Qwen/Qwen3-8B';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS'
};

// Rough token estimator: 1 token ≈ 1.5 English chars, 1 token ≈ 0.6 Chinese chars.
// We round up. The real cost is settled in settle() against the API's reported
// usage field.
function estimateTokens(messages) {
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') chars += m.content.length;
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part && typeof part.text === 'string') chars += part.text.length;
      }
    }
  }
  // Mixed: assume ~1 char per char (it's rough, but we over-estimate slightly
  // to avoid round-tripping the user into a negative balance).
  return Math.max(50, Math.ceil(chars / 2));
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  if (!SILICONFLOW_KEY) {
    return jsonResponse({ error: 'llm_not_configured' }, 503);
  }

  // 1. Auth: read the user from the bearer token by calling Supabase's
  // /auth/v1/user endpoint, which validates the JWT and returns the user.
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return jsonResponse({ error: 'no_bearer' }, 401);
  const accessToken = m[1];

  // Service-role client (for admin actions like calling the RPC with a
  // forced auth.uid() — the RPC is security definer and we pass the user
  // id explicitly below).
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Validate the user's JWT by getting their user record.
  const userRes = await admin.auth.getUser(accessToken);
  if (userRes.error || !userRes.data?.user) {
    return jsonResponse({ error: 'invalid_token', detail: userRes.error?.message }, 401);
  }
  const userId = userRes.data.user.id;

  // Read body.
  let body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'bad_body' }, 400); }
  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0) return jsonResponse({ error: 'no_messages' }, 400);

  // Determine the user's timezone offset (minutes from UTC). Default +08:00.
  const tzOffsetMinutes = Number.isFinite(body?.tz_offset_minutes) ? Math.trunc(body.tz_offset_minutes) : 480;

  // Estimate tokens. Charge 1 credit upfront (small enough that almost any
  // single message will be 1 credit, but reserve the right to charge more for
  // huge contexts).
  const estIn = estimateTokens(messages);
  const estCredits = Math.max(1, Math.ceil(estIn / 1000));

  // 2. Consume credits via the security-definer RPC. Service-role can
  //    pass any user_id; the function enforces ownership checks for
  //    authenticated callers.
  const consumeRes = await admin.rpc('ai_credits_consume', {
    p_user_id: userId,
    p_amount: estCredits,
    p_tz_offset_minutes: tzOffsetMinutes
  });
  if (consumeRes.error) {
    return jsonResponse({ error: 'consume_failed', detail: consumeRes.error.message }, 500);
  }
  const cred = consumeRes.data;
  if (!cred || !cred.ok) {
    return jsonResponse({
      error: cred?.error || 'insufficient_credits',
      credits_remaining: cred?.credits_remaining ?? 0,
      credits_total:     cred?.credits_total ?? 50,
      reset_at:          cred?.reset_at ?? null
    }, 402);
  }

  // 3. Call SiliconFlow.
  let completion;
  try {
    const r = await fetch(SILICONFLOW_URL, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${SILICONFLOW_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: SILICONFLOW_MODEL,
        messages,
        temperature: Number.isFinite(body?.temperature) ? body.temperature : 0.6,
        max_tokens: Number.isFinite(body?.max_tokens) ? Math.min(body.max_tokens, 1024) : 512,
        stream: false,
        // Pass through tool definitions if the client sent them. Most
        // SiliconFlow / OpenAI-compatible models (incl. Qwen3) honor
        // `tools` + `tool_choice` and return `tool_calls` in the response.
        ...(Array.isArray(body?.tools) && body.tools.length
          ? { tools: body.tools, tool_choice: body.tool_choice || 'auto' }
          : {})
      })
    });
    if (!r.ok) {
      const detail = await r.text();
      // Refund the credit we just consumed (the call failed).
      await admin.rpc('ai_credits_consume', {
        p_user_id: userId,
        p_amount: -estCredits,
        p_tz_offset_minutes: tzOffsetMinutes
      });
      return jsonResponse({ error: 'upstream_error', status: r.status, detail: detail.substring(0, 500) }, 502);
    }
    completion = await r.json();
  } catch (e) {
    // Refund.
    await admin.rpc('ai_credits_consume', {
      p_user_id: userId,
      p_amount: -estCredits,
      p_tz_offset_minutes: tzOffsetMinutes
    });
    return jsonResponse({ error: 'upstream_unreachable', detail: e.message }, 502);
  }

  // 4. Parse the response.
  const choice  = completion?.choices?.[0] || {};
  const message = choice.message || {};
  const reply   = message.content ?? '';
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const usage = completion?.usage ?? {};
  const outTokens = Number(usage.completion_tokens) || Math.ceil(reply.length / 2);
  const inTokens = Number(usage.prompt_tokens) || estIn;

  // 5. Settle credits. Real cost = (in_tokens + out_tokens) / 1000, rounded up.
  const realCredits = Math.max(1, Math.ceil((inTokens + outTokens) / 1000));
  const diff = realCredits - estCredits;
  if (diff !== 0) {
    // diff > 0 → charge more; diff < 0 → refund
    const r2 = await admin.rpc('ai_credits_consume', {
      p_user_id: userId,
      p_amount: diff,
      p_tz_offset_minutes: tzOffsetMinutes
    });
    if (r2.data && r2.data.ok) {
      cred.credits_remaining = r2.data.credits_remaining;
    } else if (r2.data && r2.data.error === 'insufficient_credits' && diff > 0) {
      // User ran out mid-stream — that's fine, they got the reply.
      cred.credits_remaining = 0;
    }
  }

  // 6. Execute any tool calls the model emitted. Only `set_reminder` and
  //    `cancel_reminder` need server-side action; the navigation / SOS
  //    tools are client-side only.
  const toolResults: any[] = [];
  for (const call of toolCalls) {
    const fn = call.function || {};
    const name = fn.name;
    let args: any = {};
    try { args = fn.arguments ? JSON.parse(fn.arguments) : {}; } catch (_) {}
    try {
      if (name === 'set_reminder') {
        const r = await executeSetReminder(admin, userId, args, tzOffsetMinutes);
        toolResults.push({ name, args, result: r });
      } else if (name === 'cancel_reminder') {
        const r = await executeCancelReminder(admin, userId, args);
        toolResults.push({ name, args, result: r });
      } else {
        // Client-side tools (navigate, open_*, trigger_sos, etc.) — the
        // client will execute them on receipt. We just echo back the call.
        toolResults.push({ name, args, result: { deferred: true } });
      }
    } catch (e) {
      toolResults.push({ name, args, result: { error: e.message || String(e) } });
    }
  }

  return jsonResponse({
    reply,
    tool_calls: toolCalls,
    tool_results: toolResults,
    usage: { prompt_tokens: inTokens, completion_tokens: outTokens, total_tokens: inTokens + outTokens, credits_used: realCredits },
    credits_remaining: cred.credits_remaining,
    credits_total:     cred.credits_total,
    reset_at:          cred.reset_at
  });
});

// =====================================================================
// Tool executors
// =====================================================================

/**
 * Compute the next fire time for a reminder. Accepts either a relative
 * time (e.g. "in 2 hours") or an absolute time (ISO / "tomorrow 8am")
 * in the user's timezone. Returns a UTC timestamptz string.
 */
function computeFireAt(args: any, tzOffsetMinutes: number): { fire_at: string; time_of_day: string | null; kind: 'one_off' | 'daily' } | { error: string } {
  // args can have: when (string), repeat ('once' | 'daily'), hour, minute
  const when = String(args.when || args.fire_at || args.time || '').trim();
  const repeat = String(args.repeat || 'once').toLowerCase();
  const kind: 'one_off' | 'daily' = (repeat === 'daily' || repeat === 'every_day') ? 'daily' : 'one_off';

  // The client already converts natural language like "in 2 hours" into
  // a structured ISO timestamp and passes it as args.fire_at_iso. If we
  // receive an ISO string, use it directly.
  const isoIn = String(args.fire_at_iso || '').trim();
  if (isoIn) {
    const d = new Date(isoIn);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        fire_at: d.toISOString(),
        time_of_day: kind === 'daily' ? `${hh}:${mm}` : null,
        kind
      };
    }
  }

  // Try parsing "HH:MM" for daily reminders.
  const m = when.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
    const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
    return {
      fire_at: null,
      time_of_day: `${hh}:${mm}`,
      kind: 'daily'
    };
  }

  // Try parsing "YYYY-MM-DD HH:MM" or other common formats.
  if (when) {
    const d = new Date(when);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        fire_at: d.toISOString(),
        time_of_day: kind === 'daily' ? `${hh}:${mm}` : null,
        kind
      };
    }
  }

  return { error: 'Could not parse the reminder time. Use ISO 8601, HH:MM, or pass fire_at_iso.' };
}

async function executeSetReminder(admin: any, userId: string, args: any, tzOffsetMinutes: number) {
  const label = String(args.label || args.text || '提醒').trim().slice(0, 200);
  if (!label) return { error: 'Missing label' };

  const computed = computeFireAt(args, tzOffsetMinutes);
  if ('error' in computed) return computed;
  const { fire_at, time_of_day, kind } = computed;

  // For daily reminders, compute the next fire time as the next HH:MM
  // occurrence in the user's local timezone.
  let next_fire_at: string;
  if (kind === 'daily' && time_of_day) {
    const [hh, mm] = time_of_day.split(':').map(s => parseInt(s, 10));
    const now = new Date();
    const localNow = new Date(now.getTime() + tzOffsetMinutes * 60_000);
    let target = new Date(Date.UTC(
      localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(),
      hh, mm, 0, 0
    ));
    if (target.getTime() <= now.getTime() + tzOffsetMinutes * 60_000) {
      target = new Date(target.getTime() + 24 * 3600_000);
    }
    next_fire_at = new Date(target.getTime() - tzOffsetMinutes * 60_000).toISOString();
  } else if (fire_at) {
    next_fire_at = fire_at;
  } else {
    return { error: 'No fire time computed' };
  }

  const ins = await admin.from('reminders').insert({
    user_id: userId,
    label,
    kind,
    fire_at: fire_at || null,
    time_of_day: time_of_day || null,
    next_fire_at,
    status: 'scheduled',
    source: 'chat'
  }).select('id, label, kind, next_fire_at, time_of_day').single();
  if (ins.error) return { error: ins.error.message };
  return { ok: true, reminder: ins.data };
}

async function executeCancelReminder(admin: any, userId: string, args: any) {
  const id = String(args.id || args.reminder_id || '').trim();
  if (!id) return { error: 'Missing reminder id' };
  const upd = await admin.from('reminders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, label, status')
    .single();
  if (upd.error) return { error: upd.error.message };
  return { ok: true, reminder: upd.data };
}