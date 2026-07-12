// =====================================================================
// GoldenAge AI — Supabase Edge Function: llm-chat
// =====================================================================
// Server-side LLM proxy. Holds the SiliconFlow API key, enforces a
// per-user daily credits system, and forwards chat completions.
//
// Flow:
//   1. Read user JWT from Authorization header.
//   2. Pre-charge estimated token cost; settle to the real cost after the
//      API reports usage. Credits are NOT 1-per-chat — they scale with token
//      usage via a formula (see TOKENS_PER_CREDIT below).
//   3. Build the system prompt from the user's ai_agents row (soul.md)
//      + top agent_memories + (for guardian users) paired elder activity.
//   4. Call SiliconFlow; parse reply + tool calls; execute server-side
//      tool calls (set/cancel reminder, save/forget memory).
//   5. Self-configuration (inspired by OpenClaw "Dreaming"):
//        - autoCapture(): after each reply, extract durable facts from the
//          exchange and store/merge them into agent_memories (dedup +
//          spaced-repetition importance bump).
//        - maybeAutoRefine(): when enough memories accumulate, reflect on
//          them (REM phase) and rewrite the agent's soul.md to be
//          personalized to the user — gated so a single chat can't rewrite
//          the persona.
//      A manual `action: "refine_agent"` request triggers soul refinement
//      on demand from the Me screen.
//   6. Settle credits; return reply + meta.
// =====================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SILICONFLOW_KEY = Deno.env.get('SILICONFLOW_KEY') ?? '';
const SILICONFLOW_URL = Deno.env.get('SILICONFLOW_URL') ?? 'https://api.siliconflow.cn/v1/chat/completions';
const SILICONFLOW_MODEL = Deno.env.get('SILICONFLOW_MODEL') ?? 'Qwen/Qwen3-8B';

// Credits are charged by token usage, not per message. One credit covers
// TOKENS_PER_CREDIT tokens (input + output combined). Tune this to change
// how fast credits drain; the daily cap (ai_credits table, default 50) is
// unaffected by this divisor.
const TOKENS_PER_CREDIT = 1000;

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

// Pull a JSON object out of an LLM response that may be fenced or wrapped
// in prose. Returns the parsed object (or {} on failure).
function extractJson(s) {
  if (s == null) return {};
  if (typeof s !== 'string') return s;
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch { /* fall through */ }
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch { return {}; }
  }
  return {};
}

// Small wrapper around SiliconFlow for our own internal calls (memory
// extraction, soul refinement) — keeps the main code readable.
async function callLLM(system, user, opts = {}) {
  const r = await fetch(SILICONFLOW_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${SILICONFLOW_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 500,
      stream: false
    })
  });
  if (!r.ok) throw new Error('upstream ' + r.status);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  // GET / HEAD: lightweight health probe. Direct browser hits, uptime
  // monitors, and link previews send GET — answering with a 200 here
  // (instead of a bare `method_not_allowed`) keeps those harmless while
  // the real chat path remains POST-only below.
  if (req.method === 'GET' || req.method === 'HEAD') {
    return jsonResponse({ ok: true, service: 'llm-chat', status: 'healthy', note: 'Send a POST with {messages:[...]} to talk to the AI.' });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  try {
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
  let messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    // The manual "refine_agent" action triggers soul-refinement on demand
    // and does not need user messages; give it a placeholder so token
    // estimation / credit charging below still works.
    if (body?.action === 'refine_agent') {
      messages = [{ role: 'system', content: '(auto refine)' }];
    } else {
      return jsonResponse({ error: 'no_messages' }, 400);
    }
  }

  // ── Isolated scam-check path ────────────────────────────────────────────
  // The anti-scam analyzer must run DIRECTLY against the LLM, NOT through the
  // companion persona / memory pipeline. We isolate it here so that:
  //   - the scanned scam text is NEVER captured into the user's agent memory,
  //   - it does NOT burn the companion chat-credit quota (safety is free),
  //   - it uses only the scam-analysis system prompt the client provided.
  // The client sends [system = SCAM prompt, user = text]; we echo the raw
  // model verdict back and let the client parse it.
  if (body?.action === 'scam_check') {
    const sysMsg = (messages.find((m: any) => m.role === 'system') || {}).content;
    const userMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    if (!userMsg || !userMsg.content) return jsonResponse({ error: 'no_text' }, 400);
    try {
      const raw = await callLLM(
        (typeof sysMsg === 'string' && sysMsg.trim())
          ? sysMsg
          : 'You are a fraud/scam detection analyst. Decide if the text is safe, caution, or danger. Reply with strict JSON only: {"verdict":"safe|caution|danger","confidence":0.0-1.0,"summary_zh":"","summary_en":"","reasons_zh":[],"reasons_en":[],"advice_zh":"","advice_en":""}.',
        String(userMsg.content),
        { temperature: 0.2, max_tokens: 600 }
      );
      return jsonResponse({ reply: raw });
    } catch (e) {
      return jsonResponse({ error: 'scam_llm_failed', detail: e?.message || String(e) }, 502);
    }
  }

  // Determine the user's timezone offset (minutes from UTC). Default +08:00.
  const tzOffsetMinutes = Number.isFinite(body?.tz_offset_minutes) ? Math.trunc(body.tz_offset_minutes) : 480;
  // Language for auto-config prompts (zh default).
  const lang = (body?.lang === 'en') ? 'en' : 'zh';

  // Estimate tokens. Charge 1 credit upfront (small enough that almost any
  // single message will be 1 credit, but reserve the right to charge more for
  // huge contexts).
  const estIn = estimateTokens(messages);
  // Pre-charge an estimate based on input tokens alone; the final cost is
  // settled against real (input + output) usage below.
  const estCredits = Math.max(1, Math.ceil(estIn / TOKENS_PER_CREDIT));

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

  // 2b. Load the user's agent row once (used by the manual refine action,
  //     the normal chat, and the auto-config steps below).
  const agentById = await admin.from('ai_agents')
    .select('id, name, role, soul_md, registration_code')
    .eq('user_id', userId)
    .maybeSingle();
  const agent = agentById.data || null;
  const agentRole: 'companion' | 'protector' = (agent?.role === 'protector') ? 'protector' : 'companion';

  // 2c. Manual "refine_agent" action: rewrite the soul.md from memories on
  //     demand (e.g. the user taps "Let the AI perfect its personality").
  if (body?.action === 'refine_agent') {
    if (!agent) return jsonResponse({ error: 'no_agent' }, 400);
    let refined;
    try {
      refined = await refineSoul(admin, agent, userId, lang);
    } catch (e) {
      return jsonResponse({ error: 'refine_failed', detail: e.message }, 502);
    }
    return jsonResponse({
      reply: '',
      soul_refined: true,
      soul_md: refined.soul_md,
      summary: refined.summary,
      agent: agent ? { id: agent.id, name: agent.name, role: agent.role, registration_code: agent.registration_code } : null,
      credits_remaining: cred.credits_remaining,
      credits_total:     cred.credits_total,
      reset_at:          cred.reset_at
    });
  }

  // 2d. Guardian "how's the elder been?" summary.
  //     A guardian asks about their paired elder; we pull the elder's recent
  //     chat history (plus activity) from Supabase and have the LLM summarize
  //     it into a warm, concise status update for the family.
  if (body?.action === 'guardian_summary') {
    if (agentRole !== 'protector') {
      return jsonResponse({ reply: lang === 'zh'
        ? '只有守护者账号可以查看长者的近况总结。'
        : "Only a guardian account can request the elder's status summary." });
    }
    // Resolve the paired elder from this guardian's profile.
    const gProfile = await admin.from('profiles')
      .select('elder_account_id')
      .eq('id', userId)
      .maybeSingle();
    const elderRaw = gProfile.data?.elder_account_id || null;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const elderId = (elderRaw && uuidRe.test(elderRaw)) ? elderRaw : null;
    if (!elderId) {
      return jsonResponse({ reply: lang === 'zh'
        ? '您还没有关联长者账号。请先在「守护者」页面绑定长者的配对码。'
        : "You haven't linked an elder account yet. Pair with the elder's code in the Guardian tab first." });
    }
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [chatRes, scamRes, remRes, elderMemRes, elderAgentRes, sosRes] = await Promise.all([
      admin.from('chat_history').select('role, content, created_at')
        .eq('user_id', elderId).gte('created_at', since)
        .order('created_at', { ascending: false }).limit(60),
      admin.from('scam_reports').select('created_at, verdict, advice')
        .eq('user_id', elderId).gte('created_at', since).order('created_at', { ascending: false }).limit(10),
      admin.from('reminders').select('label, kind, next_fire_at, status')
        .eq('user_id', elderId).in('status', ['scheduled', 'fired']).order('next_fire_at', { ascending: true }).limit(20),
      admin.from('agent_memories').select('category, content, importance, created_at')
        .eq('subject_user_id', elderId).neq('category', '_meta').order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(10),
      admin.from('ai_agents').select('name, role').eq('user_id', elderId).maybeSingle(),
      admin.from('sos_events').select('created_at, kind, resolved, note')
        .eq('user_id', elderId).gte('created_at', since).order('created_at', { ascending: false }).limit(10).catch(() => ({ data: [] })),
    ]);

    const elderName = (elderAgentRes.data?.name) || (lang === 'zh' ? '长者' : 'the elder');
    const chats = (chatRes.data || []).reverse(); // chronological
    const transcript = chats.length
      ? chats.map((c: any) => `${c.role === 'user' ? (lang === 'zh' ? '长者' : 'Elder') : (lang === 'zh' ? 'AI' : 'AI')}: ${String(c.content || '').substring(0, 300)}`).join('\n')
      : (lang === 'zh' ? '（最近 7 天没有对话记录）' : '(no chat history in the last 7 days)');

    const activity =
      '\n### 防诈骗检测\n' + ((scamRes.data || []).length ? (scamRes.data as any[]).map((r: any) => `- ${r.created_at} → ${r.verdict}`).join('\n') : (lang === 'zh' ? '（无）' : 'none')) +
      '\n### 用药与提醒\n' + ((remRes.data || []).length ? (remRes.data as any[]).map((r: any) => `- ${r.label} (${r.status})`).join('\n') : (lang === 'zh' ? '（无）' : 'none')) +
      '\n### SOS 求助\n' + ((sosRes.data || []).length ? (sosRes.data as any[]).map((r: any) => `- ${r.created_at} ${r.kind} ${r.resolved ? (lang === 'zh' ? '已处理' : 'resolved') : (lang === 'zh' ? '待处理' : 'open')}`).join('\n') : (lang === 'zh' ? '（无）' : 'none')) +
      '\n### 长者记忆\n' + ((elderMemRes.data || []).length ? (elderMemRes.data as any[]).map((m: any) => `- [${m.category}] ${m.content}`).join('\n') : (lang === 'zh' ? '（无）' : 'none'));

    const summarySys = lang === 'zh'
      ? '你是长者陪伴 AI 的「近况总结员」。下面是一位长者最近 7 天与 AI 的对话记录，以及他的一些活动数据。请用温暖、简洁的中文，为他的家人写一段「近况总结」：\n- 他最近聊了什么话题、情绪如何、有没有提到健康/家人/孤独等；\n- 有没有异常或需要家人关注的事（诈骗、用药、SOS）；\n- 给家人一句温暖的、可执行的建议。\n不要编造对话里没有的信息。控制在 250 字以内。'
      : 'You are the "recent-activity summarizer" for an elderly companion AI. Below is the elder\'s chat history with the AI over the last 7 days, plus some activity data. Write a warm, concise summary for their family:\n- What topics they discussed, their mood, any mentions of health/family/loneliness;\n- Any anomalies or things the family should watch (scams, medication, SOS);\n- One warm, actionable suggestion.\nDo not invent anything not in the transcript. Keep under 250 words.';

    const summaryUser = lang === 'zh'
      ? `长者端 AI 名字：${elderName}\n\n=== 最近 7 天对话记录 ===\n${transcript}\n\n=== 其他活动 ===${activity}\n\n请输出近况总结：`
      : `Elder's AI name: ${elderName}\n\n=== Chat history (last 7 days) ===\n${transcript}\n\n=== Other activity ===${activity}\n\nPlease write the summary:`;

    try {
      const summary = await callLLM(summarySys, summaryUser, { temperature: 0.4, max_tokens: 600 });
      return jsonResponse({
        reply: summary,
        guardian_summary: true,
        elder_name: elderName,
        chat_count: chats.length,
        credits_remaining: cred.credits_remaining,
        credits_total: cred.credits_total,
        reset_at: cred.reset_at
      });
    } catch (e) {
      return jsonResponse({ error: 'summary_failed', detail: e?.message || String(e) }, 502);
    }
  }

// 3. Build the system prompt: load the top agent_memories + (for guardian
//    users) recent activity of the paired elder. Then call SiliconFlow.
let completion;
let memories: any[] = [];
try {
  // 3b. Read the user's top memories (exclude the internal _meta sentinel
  //     row we use to track soul-refinement state).
  const memRes = agent ? await admin.from('agent_memories')
    .select('id, subject_user_id, category, content, importance, created_at')
    .eq('agent_id', agent.id)
    .neq('category', '_meta')
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20) : { data: [] };
  memories = memRes.data || [];

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
          .eq('subject_user_id', elderId).neq('category', '_meta').order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(10),
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

    // Persist this conversation turn into chat_history so a paired guardian
    // can later ask "how's the elder been?" and we can summarize it. The
    // chatting user's id is `userId`; for a companion this is the elder.
    // Non-fatal: a failed insert must never break the reply.
    try {
      const _reply: string = (completion?.choices?.[0]?.message?.content) ?? '';
      const lastUserTurn = [...messages].reverse().find((m: any) => m.role === 'user');
      const rows: any[] = [];
      if (lastUserTurn && typeof lastUserTurn.content === 'string' && lastUserTurn.content.trim()) {
        rows.push({ user_id: userId, session_id: body?.session_id ?? null, role: 'user', content: lastUserTurn.content.substring(0, 4000) });
      }
      if (_reply) rows.push({ user_id: userId, session_id: body?.session_id ?? null, role: 'assistant', content: _reply.substring(0, 4000) });
      if (rows.length) await admin.from('chat_history').insert(rows);
    } catch (histErr) {
      console.warn('chat_history insert failed (non-fatal):', histErr?.message || histErr);
    }
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

  // 5. Settle credits. The cost is token-based (not per-message):
  //    credits = ceil((input_tokens + output_tokens) / TOKENS_PER_CREDIT),
  //    with a 1-credit floor so even a tiny reply costs something.
  const realCredits = Math.max(1, Math.ceil((inTokens + outTokens) / TOKENS_PER_CREDIT));
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

  // 6. Execute any tool calls the model emitted. Only `set_reminder`,
  //    `cancel_reminder`, `save_memory`, `forget_memory` need server-side
  //    action; the navigation / SOS tools are client-side only.
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

  // 7. Self-configuration (OpenClaw "Dreaming" inspired):
  //    - Capture durable facts from this exchange.
  //    - If enough memories have accumulated, reflect and refine the soul.
  let capture = { added: 0, updated: 0 };
  let soulRefined = false;
  try {
    const lastUser = [...messages].reverse().find((mm: any) => mm.role === 'user');
    const userText = (lastUser && typeof lastUser.content === 'string') ? lastUser.content : '';
    if (agent) {
      capture = await autoCapture(admin, agent, userId, userText, reply, lang);
      soulRefined = await maybeAutoRefine(admin, agent, userId, lang);
    }
  } catch (e) {
    console.warn('self-config error (non-fatal):', e?.message || e);
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
    memories_used: memories.length,
    auto_memories: capture,
    soul_refined: soulRefined
  });
  } catch (e) {
    // Never leak internal stack traces / messages to clients; log server-side only.
    console.error('llm-chat unhandled error:', e?.message || e, e?.stack || '');
    return jsonResponse({ error: 'internal_error' }, 500);
  }
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
// Self-configuration: memory extraction + soul refinement
// =====================================================================
//
// Mirror of OpenClaw's "Dreaming" pipeline, adapted to a server-side,
// per-user companion:
//   - autoCapture()  = in-conversation capture (the "light" + "REM" capture)
//   - maybeAutoRefine() = the "deep" promotion gate
//   - refineSoul()   = the reflection that rewrites soul.md
//
// All state lives in the existing ai_agents / agent_memories tables. A
// single `_meta` memory row (category='_meta') stores soul-refinement
// bookkeeping so we need no schema migration.

async function autoCapture(admin: any, agent: any, userId: string, userText: string, assistantText: string, lang: string) {
  if (!userText || userText.trim().length < 4) return { added: 0, updated: 0 };
  // Load recent memories to give the extractor dedup context.
  const memRes = await admin.from('agent_memories')
    .select('id, category, content, importance')
    .eq('agent_id', agent.id)
    .neq('category', '_meta')
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(15);
  const existing: any[] = memRes.data || [];

  const isZh = lang !== 'en';
  const existingBlock = existing.length
    ? existing.map(m => `- ${m.content}`).join('\n')
    : (isZh ? '（无）' : '(none)');
  const sys = isZh
    ? `你是记忆抽取引擎。从用户与 AI 的最新一轮对话中，抽取值得长期记住的「事实」（用户的偏好、健康、家人、作息习惯、情绪倾向、重要事件）。\n已有记忆（用于去重或更新，不要重复）：\n${existingBlock}\n只输出 JSON：{"new":[{"category":"preference|health|family|habit|event|mood|fact","content":"简洁陈述（中文）","importance":1-10}],"update":[{"match":"已有记忆的原文片段","importance":1-10}]}。\n不要抽取闲聊、寒暄、临时提问。new 最多 5 条。importance 表示长期重要性（健康/家人相关更高）。`
    : `You are a memory extraction engine. From the latest user<->AI exchange, extract durable facts worth remembering (user preferences, health, family, habits, mood, important events). Existing memories (for dedup/update, do not duplicate):\n${existingBlock}\nOutput ONLY JSON: {"new":[{"category":"preference|health|family|habit|event|mood|fact","content":"concise statement","importance":1-10}],"update":[{"match":"fragment of an existing memory","importance":1-10}]}. Skip small talk/greetings. At most 5 new. importance = long-term value (health/family higher).`;
  const userContent = isZh
    ? `用户说：${userText}\nAI 回复：${assistantText}`
    : `User said: ${userText}\nAI replied: ${assistantText}`;

  let parsed: any;
  try {
    const txt = await callLLM(sys, userContent, { temperature: 0.2, max_tokens: 500 });
    parsed = extractJson(txt);
  } catch (e) {
    return { added: 0, updated: 0 };
  }
  if (!parsed || (!Array.isArray(parsed.new) && !Array.isArray(parsed.update))) {
    return { added: 0, updated: 0 };
  }

  let added = 0, updated = 0;
  for (const mem of (parsed.new || [])) {
    const content = String(mem.content || '').trim();
    if (!content || content.length > 300) continue;
    const norm = content.toLowerCase();
    const dup = existing.find(e => e.content.trim().toLowerCase() === norm);
    const cat = String(mem.category || 'fact').slice(0, 20);
    const imp = Math.max(1, Math.min(10, parseInt(mem.importance, 10) || 5));
    if (dup) {
      // Spaced-repetition signal: a repeated fact gains importance.
      if (imp > dup.importance) {
        await admin.from('agent_memories')
          .update({ importance: imp, updated_at: new Date().toISOString() })
          .eq('id', dup.id);
      }
      updated++;
    } else {
      const ins = await admin.from('agent_memories')
        .insert({ agent_id: agent.id, subject_user_id: userId, category: cat, content, importance: imp, source: 'auto' })
        .select('id').single();
      if (!ins.error) {
        added++;
        existing.push({ id: ins.data.id, content, importance: imp, category: cat });
      }
    }
  }
  for (const u of (parsed.update || [])) {
    const frag = String(u.match || '').trim().toLowerCase();
    if (!frag) continue;
    const tgt = existing.find(e => e.content.trim().toLowerCase().includes(frag));
    if (tgt) {
      const imp = Math.max(1, Math.min(10, parseInt(u.importance, 10) || tgt.importance));
      await admin.from('agent_memories')
        .update({ importance: Math.max(tgt.importance, imp), updated_at: new Date().toISOString() })
        .eq('id', tgt.id);
      updated++;
    }
  }
  return { added, updated };
}

// Read the soul-refinement bookkeeping stored in the _meta sentinel row.
async function readMeta(admin: any, agent: any) {
  const res = await admin.from('agent_memories')
    .select('id, content')
    .eq('agent_id', agent.id)
    .eq('category', '_meta')
    .maybeSingle();
  if (!res.data) return { id: null, at: null, version: 0 };
  try {
    const o = JSON.parse(res.data.content);
    return { id: res.data.id, at: o.at || null, version: o.version || 0 };
  } catch {
    return { id: res.data.id, at: null, version: 0 };
  }
}

async function writeMeta(admin: any, agent: any, userId: string, meta: { id: string | null; at: string; version: number }) {
  if (meta.id) {
    await admin.from('agent_memories')
      .update({ content: JSON.stringify({ kind: 'soul_refined', at: meta.at, version: meta.version }), updated_at: new Date().toISOString() })
      .eq('id', meta.id);
  } else {
    await admin.from('agent_memories')
      .insert({ agent_id: agent.id, subject_user_id: userId, category: '_meta', content: JSON.stringify({ kind: 'soul_refined', at: meta.at, version: meta.version }), importance: 1, source: 'system' });
  }
}

// Reflect on accumulated memories and rewrite the agent's soul.md to be
// personalized to the user. Returns the new soul_md + a one-line summary.
async function refineSoul(admin: any, agent: any, userId: string, lang: string) {
  const memRes = await admin.from('agent_memories')
    .select('category, content, importance')
    .eq('agent_id', agent.id)
    .neq('category', '_meta')
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40);
  const mems: any[] = memRes.data || [];
  const meta = await readMeta(admin, agent);

  const isZh = lang !== 'en';
  const roleName = agent.role === 'protector' ? (isZh ? '守护者' : 'guardian') : (isZh ? '陪伴' : 'companion');
  const memBlock = mems.length ? mems.map(m => `- [${m.category}] ${m.content}`).join('\n') : (isZh ? '（暂无记忆）' : '(no memories)');
  const sys = isZh
    ? `你是为「${roleName}」角色 AI 助手做人格(Soul)优化的引擎。\n根据下面已记住的用户事实，把现有的 Soul 重写得更个性化、更贴合这位用户，但保持角色边界与红线不变。\n只输出 JSON：{"soul_md": "新的 Soul 全文（中文、markdown、结构清晰，长度不超过原稿 1.2 倍）", "summary": "一句话说明这次改了什么"}。`
    : `You refine the Soul (persona) of a "${roleName}" role AI assistant. Using the remembered user facts below, rewrite the existing Soul to be more personalized to this user while keeping role boundaries and red lines. Output ONLY JSON: {"soul_md":"full new Soul (English, markdown, concise, <=1.2x original length)","summary":"one line of what changed"}.`;
  const userContent = isZh
    ? `现有 Soul：\n${agent.soul_md || '(空)'}\n\n已记住的事实：\n${memBlock}\n\n请输出新的 Soul（只用 JSON）。`
    : `Current Soul:\n${agent.soul_md || '(empty)'}\n\nRemembered facts:\n${memBlock}\n\nOutput the new Soul (JSON only).`;

  const txt = await callLLM(sys, userContent, { temperature: 0.4, max_tokens: 800 });
  const parsed = extractJson(txt);
  const newSoul = (parsed && typeof parsed.soul_md === 'string' && parsed.soul_md.trim())
    ? parsed.soul_md.trim()
    : agent.soul_md;
  const summary = (parsed && typeof parsed.summary === 'string') ? parsed.summary : '';

  await admin.from('ai_agents')
    .update({ soul_md: newSoul, updated_at: new Date().toISOString() })
    .eq('id', agent.id);

  await writeMeta(admin, agent, userId, { id: meta.id, at: new Date().toISOString(), version: (meta.version || 0) + 1 });
  return { soul_md: newSoul, summary };
}

// Gate the automatic soul refinement: only rewrite the persona when enough
// durable memories exist AND at least 7 days have passed since the last
// rewrite. This prevents a single emotional chat from over-fitting the
// persona (spaced-repetition style gating, à la OpenClaw).
async function maybeAutoRefine(admin: any, agent: any, userId: string, lang: string): Promise<boolean> {
  const memRes = await admin.from('agent_memories')
    .select('id')
    .eq('agent_id', agent.id)
    .neq('category', '_meta');
  const count = memRes.data ? memRes.data.length : 0;
  if (count < 6) return false;
  const meta = await readMeta(admin, agent);
  const sevenDays = 7 * 86400_000;
  if (meta.at && (Date.now() - new Date(meta.at).getTime()) < sevenDays) return false;
  await refineSoul(admin, agent, userId, lang);
  return true;
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
