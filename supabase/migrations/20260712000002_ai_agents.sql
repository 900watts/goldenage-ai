-- =====================================================================
-- 13. AI AGENTS + MEMORIES  ─ per-user persistent AI assistant
-- =====================================================================
-- Each user gets one ai_agents row (a unique, friendly registration code
-- is generated) plus a list of agent_memories (facts the AI has learned
-- about them, or about a paired elder for guardian users).
--
-- The Edge Function `llm-chat` reads the user's agent + top memories on
-- every request, weaves them into the system prompt as "soul.md" +
-- "memory.txt" and, for guardian users, also pulls recent activity from
-- the paired elder's records (scam_reports, reminders, etc.) so the
-- guardian's AI can answer "what happened to dad today?".

create type public.agent_role as enum (
  'companion',     -- the elder's personal AI (default role: 'elder')
  'protector'      -- the guardian/family member's AI (default role: 'guardian')
);

create table public.ai_agents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.profiles(id) on delete cascade,
  name              text not null,                  -- "小金", "守护者小李"
  role              public.agent_role not null,
  registration_code text not null unique,            -- 6-char friendly code shown in the Me screen
  soul_md           text not null default '',        -- the agent's soul/prompt, editable from Me
  model_pref        text not null default 'qwen3-8b',
  memory_count      int  not null default 0,         -- denormalized count, updated on add/delete
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index ai_agents_user_idx on public.ai_agents(user_id);
create index ai_agents_code_idx on public.ai_agents(registration_code);

alter table public.ai_agents enable row level security;
create policy "agent self read"   on public.ai_agents for select using (auth.uid() = user_id);
create policy "agent self write"  on public.ai_agents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.agent_memories (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.ai_agents(id) on delete cascade,
  -- Optional link to the user this memory is ABOUT. A companion's memories
  -- are about themselves (user_id of the agent's owner); a protector's
  -- memories can be about their paired elder. We use the same `subject_user_id`
  -- so a protector can ask "what does my AI know about dad?" and the answer
  -- filters by subject_user_id = dad.
  subject_user_id uuid not null references public.profiles(id) on delete cascade,
  category    text not null,                    -- 'preference' | 'habit' | 'fact' | 'event' | 'health' | 'family'
  content     text not null,                    -- free-form short fact
  importance  int  not null default 5 check (importance between 1 and 10),
  source      text not null default 'auto',     -- 'auto' (AI extracted) | 'manual' (user typed) | 'system'
  created_at  timestamptz default now()
);

create index agent_memories_agent_idx     on public.agent_memories(agent_id, importance desc, created_at desc);
create index agent_memories_subject_idx   on public.agent_memories(subject_user_id, importance desc, created_at desc);

alter table public.agent_memories enable row level security;
-- Only the agent's owner can read/write their own memories.
create policy "memory self read"  on public.agent_memories for select
  using (exists (select 1 from public.ai_agents a where a.id = agent_memories.agent_id and a.user_id = auth.uid()));
create policy "memory self write" on public.agent_memories for all
  using (exists (select 1 from public.ai_agents a where a.id = agent_memories.agent_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.ai_agents a where a.id = agent_memories.agent_id and a.user_id = auth.uid()));

-- Trigger: keep ai_agents.memory_count in sync.
create or replace function public.ai_agents_touch_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.ai_agents set memory_count = memory_count + 1, updated_at = now() where id = new.agent_id;
  elsif tg_op = 'DELETE' then
    update public.ai_agents set memory_count = greatest(0, memory_count - 1), updated_at = now() where id = old.agent_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger agent_memories_count_trg
  after insert or delete on public.agent_memories
  for each row execute procedure public.ai_agents_touch_count();

-- Helper: generate a 6-char friendly code like "K7M2A9".
create or replace function public.ai_agent_new_code() returns text as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no I, O, 0, 1 (easier to read)
  new_code text := '';
  i int;
  collides boolean;
begin
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + (random() * 33)::int, 1);
    end loop;
    select exists (select 1 from public.ai_agents where registration_code = new_code) into collides;
    exit when not collides;
  end loop;
  return new_code;
end;
$$ language plpgsql security definer;

-- ai_agent_create(p_name, p_role, p_soul_md) - the client calls this on
-- first sign-in to provision the user's agent row. Returns the row.
create or replace function public.ai_agent_create(
  p_name text,
  p_role public.agent_role,
  p_soul_md text default ''
) returns public.ai_agents language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.ai_agents;
  v_row public.ai_agents;
begin
  if v_user_id is null then
    raise exception 'auth' using errcode = '28000';
  end if;

  select * into v_existing from public.ai_agents where user_id = v_user_id limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.ai_agents (user_id, name, role, soul_md, registration_code)
    values (v_user_id, p_name, p_role, coalesce(p_soul_md, ''), public.ai_agent_new_code())
    returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.ai_agent_create(text, public.agent_role, text) to authenticated;

-- ai_agent_set_soul(p_soul_md) - update the agent's soul.md (the user
-- can edit it from the Me -> My AI screen).
create or replace function public.ai_agent_set_soul(p_soul_md text)
returns public.ai_agents language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.ai_agents;
begin
  if v_user_id is null then
    raise exception 'auth' using errcode = '28000';
  end if;
  update public.ai_agents set soul_md = p_soul_md, updated_at = now() where user_id = v_user_id returning * into v_row;
  if v_row is null then
    raise exception 'no_agent' using errcode = 'P0002';
  end if;
  return v_row;
end;
$$;

grant execute on function public.ai_agent_set_soul(text) to authenticated;

alter publication supabase_realtime add table public.ai_agents;
alter publication supabase_realtime add table public.agent_memories;
