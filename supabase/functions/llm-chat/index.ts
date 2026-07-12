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

// 3. Build the system prompt: load the user's ai_agents row + top
//    agent_memories + (for guardian users) recent activity of the
//    paired elder. Then call SiliconFlow.
let completion;
try {
  // 3a. Read the agent row.
  const agentRes = await admin.from('ai_agents')
    .select('id, name, role, soul_md, registration_code, subject_user_id_default')
    .eq('user_id', userId)
    .maybeSingle();
  const agent = agentRes.data || null;
  const agentRole: 'companion' | 'protector' = (agent?.role === 'protector') ? 'protector' : 'companion';

  // 3b. Read the user's top memories.
  const memRes = agent ? await admin.from('agent_memories')
    .select('id, subject_user_id, category, content, importance, created_at')
    .eq('agent_id', agent.id)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20) : { data: [] };
  const memories: any[] = memRes.data || [];

  // 3c. If the user is a guardian, find the paired elder and load the
  //     last 24h of their activity (scam_reports, medication_schedules,
  //     reminders, plus any memories the elder's AI has written about them).
  let protectedElderContext = '';
  if (agentRole === 'protector') {
    // The pairing is stored on profiles (elder_account_id on the guardian
    // row, or guardian_account_id on the elder row).
    const profileRes = await admin.from('profiles')
      .select('id, elder_account_id')
      .eq('id', userId)
      .maybeSingle();
    const elderIdRaw = profileRes.data?.elder_account_id || null;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const elderId = (elderIdRaw && uuidRe.test(elderIdRaw)) ? elderIdRaw : null;
    if (elderId) {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      // Run independent queries in parallel.
      const [scamRes, remRes, elderMemRes, elderAgentRes, sosRes] = await Promise.all([
        admin.from('scam_reports').select('created_at, input_text, verdict, advice')
          .eq('user_id', elderId).gte('created_at', since).order('created_at', { ascending: false }).limit(10),
        admin.from('reminders').select('label, kind, next_fire_at, fire_count, status')
          .eq('user_id', elderId).in('status', ['scheduled', 'fired']).order('next_fire_at', { ascending: true }).limit(20),
        // Memories the elder's AI has written ABOUT this elder.
        admin.from('agent_memories').select('category, content, importance, created_at')
          .eq('subject_user_id', elderId).order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(10),
        // Elder's agent info (so we can refer to them by their AI's name).
        admin.from('ai_agents').select('name, role').eq('user_id', elderId).maybeSingle(),
        // SOS events (if any) in the last 24h.
        admin.from('sos_events').select('created_at, kind, resolved, note')
          .eq('user_id', elderId).gte('created_at', since).order('created_at', { ascending: false }).limit(10).then(r => r).catch(() => ({ data: [] })),
      ]);

      // Also pull the user's own memories about THIS elder (the guardian's
      // AI may have been writing notes like "Dad is allergic to penicillin").
      const ownAboutElder = memories.filter(m => m.subject_user_id === elderId);

      protectedElderContext = '\n\n## 你保护的长者近况（最近 24 小时 + 持久记忆）\n\n'
        + `长者用户 id: ${elderId}\n`
        + (elderAgentRes.data ? `长者端的 AI 名字: ${elderAgentRes.data.name}\n` : '')
        + '\n### 对方 AI 记住的关于长者的事\n'
        + (ownAboutElder.length
            ? ownAboutElder.map(m => `- [${m.category}] ${m.content} (重要度 ${m.importance})`).join('\n')
            : '（暂无）')
        + '\n\n### 长者本人的记忆（长者端 AI 写下的）\n'
        + (elderMemRes.data && elderMemRes.data.length
            ? elderMemRes.data.map((m: any) => `- [${m.category}] ${m.content} (重要度 ${m.importance})`).join('\n')
            : '（暂无）')
        + '\n\n### 长者最近 24 小时的动态\n'
        + '\n**防诈骗检测**:\n'
        + (scamRes.data && scamRes.data.length
            ? scamRes.data.map((r: any) => `- ${r.created_at} → ${r.verdict}（${(r.advice || '').substring(0, 60)}）`).join('\n')
            : '（无）')
        + '\n**用药与提醒**:\n'
        + (remRes.data && remRes.data.length
            ? remRes.data.map((r: any) => `- ${r.status} ${r.kind === 'daily' ? '每日' : '一次性'} 「${r.label}」（下次 ${r.next_fire_at}）`).join('\n')
            : '（无）')
        + '\n**SOS 求助**:\n'
        + (sosRes.data && sosRes.data.length
            ? sosRes.data.map((r: any) => `- ${r.created_at} ${r.kind} ${r.resolved ? '已处理' : '待处理'}${r.note ? ' 备注: ' + r.note : ''}`).join('\n')
            : '（无）')
        + '\n\n> 当守护者问"今天长者怎么样"或"我爸妈最近情况"时，**先根据上面这些数据回答**，再补充你自己的判断。'
        + '\n> 简洁明了。突出"安全"和"异常"两类信息。';
    }
  }

  // 3d. Build the augmented system prompt.
  const userSystemMsg = messages.find((m: any) => m.role === 'system');
  const userSystemContent = userSystemMsg?.content || '';
  const baseSystem = buildLlmSystemPrompt(agent, memories, protectedElderContext);
  const finalSystem = userSystemContent
    ? `${baseSystem}\n\n---\n\n[APP_INJECTED_USER_SYSTEM_PROMPT]\n\n${userSystemContent}`
    : baseSystem;
  const finalMessages = [
    { role: 'system', content: finalSystem },
    ...messages.filter((m: any) => m.role !== 'system')
  ];

  const r = await fetch(SILICONFLOW_URL, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${SILICONFLOW_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
      messages: finalMessages,
      temperature: Number.isFinite(body?.temperature) ? body.temperature : 0.6,
      max_tokens: Number.isFinite(body?.max_tokens) ? Math.min(body.max_tokens, 1024) : 512,
      stream: false,
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
      } else if (name === 'save_memory') {
        const r = await executeSaveMemory(admin, userId, args);
        toolResults.push({ name, args, result: r });
      } else if (name === 'forget_memory') {
        const r = await executeForgetMemory(admin, userId, args);
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
    reset_at:          cred.reset_at,
    agent: agent ? { id: agent.id, name: agent.name, role: agent.role, registration_code: agent.registration_code } : null,
    memories_used: memories.length
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

// =====================================================================
// System prompt builder: soul.md + memories + (for guardian) elder ctx
// =====================================================================
function buildLlmSystemPrompt(agent: any, memories: any[], elderCtx: string): string {
  const role: 'companion' | 'protector' = (agent?.role === 'protector') ? 'protector' : 'companion';
  const name = (agent?.name || '小金').toString();
  const soul = (agent?.soul_md && agent.soul_md.trim().length > 0)
    ? agent.soul_md
    : (role === 'protector'
        ? '你是一位守护者的 AI 助手。\n\n## 你的性格\n- 沉稳、值得信赖\n- 回答简洁，重点突出\n\n## 你能做什么\n- 查阅你最近记住的关于这位长者的记忆\n- 自动查询他/她最近 24 小时的动态（防诈骗检测、用药提醒、SOS）\n- 总结为一句话：今天老人做了什么、有没有需要关注的事\n\n## 红线\n- 不代替医生下诊断\n- 不透露老人未授权的隐私（银行卡、密码、住址）'
        : '你是一位贴心的长者陪伴 AI。\n\n## 你的性格\n- 温和、有耐心、不急躁\n- 称呼对方"您"或用户告诉你的昵称\n- 说话简短明确，不用网络用语\n- 主动关心健康、作息、情绪\n\n## 你能做什么\n- 聊天、问候、提醒用药、量血压、关注天气\n- 帮助识别诈骗短信、陌生链接\n- 在用户让你"记住"某件事时，把它存进你的记忆区\n\n## 红线\n- 不引导用户在不明链接里输入银行卡号、验证码\n- 不代替医生开药、给诊断');

  // Memories block (compact).
  const memBlock = (memories && memories.length)
    ? memories.map(m => `- [${m.category} 重要度${m.importance}] ${m.content}`).join('\n')
    : '（暂无）';

  return `你叫"${name}"。${soul}\n\n## 你已记住的事（memory.txt）\n${memBlock}${elderCtx}`;
}

// =====================================================================
// Memory tool executors
// =====================================================================
async function executeSaveMemory(admin: any, userId: string, args: any) {
  const content = String(args.content || args.fact || '').trim();
  if (!content) return { error: 'Missing content' };
  const category = String(args.category || 'fact');
  const importance = Math.max(1, Math.min(10, parseInt(args.importance, 10) || 5));
  // Find the agent row.
  const agentRes = await admin.from('ai_agents')
    .select('id, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (agentRes.error) return { error: agentRes.error.message };
  if (!agentRes.data) return { error: 'No agent registered for this user' };
  const agentId = agentRes.data.id;

  // For protector agents, the memory is about their paired elder.
  // For companion agents, the memory is about themselves (the user).
  let subject_user_id = userId;
  if (agentRes.data.role === 'protector') {
    const profileRes = await admin.from('profiles')
      .select('elder_account_id')
      .eq('id', userId)
      .maybeSingle();
    const raw = profileRes.data?.elder_account_id;
    if (raw) {
      // elder_account_id is stored as text; agent_memories.subject_user_id
      // is uuid. Validate before insert.
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRe.test(raw)) subject_user_id = raw;
    }
  }

  const ins = await admin.from('agent_memories').insert({
    agent_id,
    subject_user_id,
    category,
    content: content.substring(0, 500),
    importance,
    source: 'auto'
  }).select('id, category, content, importance').single();
  if (ins.error) return { error: ins.error.message };
  return { ok: true, memory: ins.data };
}

async function executeForgetMemory(admin: any, userId: string, args: any) {
  const id = String(args.id || args.memory_id || '').trim();
  if (!id) return { error: 'Missing memory id' };
  // Verify the memory belongs to this user (via their agent).
  const agentRes = await admin.from('ai_agents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!agentRes.data) return { error: 'No agent' };
  const del = await admin.from('agent_memories')
    .delete()
    .eq('id', id)
    .eq('agent_id', agentRes.data.id);
  if (del.error) return { error: del.error.message };
  return { ok: true, id };
}