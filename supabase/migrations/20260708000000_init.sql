-- =====================================================================
-- GoldenAge AI — Supabase Database Schema
-- =====================================================================
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Equivalent CLI: `supabase db reset` (with this file in supabase/migrations).
--
-- Tables created (in dependency order):
--   1. profiles              (extends auth.users with elder-specific fields)
--   2. user_preferences      (text-scale, theme, language)
--   3. memory_embeddings     (pgvector — long-term AI memory)
--   4. session_logs          (per-day mood + activity summary)
--   5. medication_schedules  (reminders + compliance log)
--   6. medication_logs       (taken / missed / skipped)
--   7. guardians             (family pairing via encrypted token)
--   8. crisis_events         (SOS / fall / chest-pain → guardian bypass)
--   9. news_bookmarks        (saved daily-digest items)
--  10. scam_reports          (elder-fraud evaluation log)
--  11. finance_watchlist     (gold/silver/stocks user tracks)
--
-- Phase 2 also enables:
--   * pgvector extension (semantic AI memory)
--   * RLS on every table (privacy-first)
--   * Realtime publication for guardian sync
--   * Storage bucket for medical reports
-- =====================================================================

-- ---------- 0. Extensions -----------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pgvector" with schema extensions;
create extension if not exists "pg_trgm"; -- fuzzy text search (news/memory)

-- =====================================================================
-- 1. PROFILES  ─ extends auth.users with elder-specific data
-- =====================================================================
create type public.elder_mobility as enum ('independent', 'cane', 'walker', 'wheelchair');
create type public.elder_hearing as enum ('normal', 'mild', 'moderate', 'severe');

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null,
  preferred_name      text,                            -- e.g. "王爷爷" (what the AI calls them)
  phone_e164          text unique,
  birth_date          date,
  city                text,
  mobility            public.elder_mobility default 'independent',
  hearing             public.elder_hearing   default 'normal',
  emergency_contact   text,                            -- free-form: "王小明 139..."
  primary_guardian_id uuid,                            -- FK added after guardians table
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index profiles_phone_idx on public.profiles(phone_e164);

alter table public.profiles enable row level security;

-- A user can read & update ONLY their own profile.
create policy "profile self read"  on public.profiles
  for select using (auth.uid() = id);
create policy "profile self write" on public.profiles
  for update using (auth.uid() = id);
create policy "profile self insert" on public.profiles
  for insert with check (auth.uid() = id);

-- =====================================================================
-- 2. USER PREFERENCES  ─ Big Text Mode, theme, language
-- =====================================================================
create table public.user_preferences (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  big_text_mode      boolean not null default true,   -- SPEC: ON by default
  dark_mode          boolean not null default false,
  language           text    not null default 'zh',  -- 'zh' or 'en'
  voice_speed        numeric not null default 0.9,   -- TTS playback rate
  haptics_enabled    boolean not null default true,
  audio_cues_enabled boolean not null default true,
  updated_at         timestamptz default now()
);

alter table public.user_preferences enable row level security;
create policy "prefs self read"  on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs self write" on public.user_preferences for update using (auth.uid() = user_id);
create policy "prefs self insert" on public.user_preferences for insert with check (auth.uid() = user_id);

-- =====================================================================
-- 3. MEMORY EMBEDDINGS  ─ pgvector long-term AI memory
-- =====================================================================
-- Stores semantic vector embeddings of user preferences, frequent topics,
-- and historical session summaries. The AI agent retrieves them via
-- cosine-similarity search ("what does this user care about?").
create table public.memory_embeddings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,                          -- the raw text the embedding represents
  embedding   extensions.vector(1536),                -- matches OpenAI text-embedding-3-small
  category    text not null default 'general',        -- 'preference'|'health'|'family'|'finance'|'routine'
  importance  smallint not null default 5 check (importance between 1 and 10),
  source      text,                                   -- 'chat'|'news'|'medication'|'system'
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index memory_user_idx        on public.memory_embeddings(user_id);
create index memory_category_idx    on public.memory_embeddings(user_id, category);
-- IVFFlat index for fast cosine-similarity search (rebuild after bulk inserts).
create index memory_embedding_ivf   on public.memory_embeddings
  using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 100);

alter table public.memory_embeddings enable row level security;
create policy "memory self read"   on public.memory_embeddings for select using (auth.uid() = user_id);
create policy "memory self write"  on public.memory_embeddings for insert with check (auth.uid() = user_id);
create policy "memory self delete" on public.memory_embeddings for delete using (auth.uid() = user_id);

-- RPC: semantic search across the user's own memory
create or replace function public.match_user_memory(
  p_user_id   uuid,
  p_embedding extensions.vector(1536),
  p_match_threshold float default 0.7,
  p_match_count     int   default 8
) returns table (
  id          uuid,
  content     text,
  category    text,
  importance  smallint,
  similarity  float
) language sql stable as $$
  select
    m.id,
    m.content,
    m.category,
    m.importance,
    1 - (m.embedding <=> p_embedding) as similarity
  from public.memory_embeddings m
  where m.user_id = p_user_id
    and 1 - (m.embedding <=> p_embedding) > p_match_threshold
  order by m.embedding <=> p_embedding
  limit p_match_count;
$$;

-- =====================================================================
-- 4. SESSION LOGS  ─ per-day mood + activity summary (privacy-safe)
-- =====================================================================
-- The Guardian AI bridge reads THIS table — never raw conversations.
-- The AI summarises: "Mom read 3 news articles, mood: cheerful,
-- medication compliance 100%."
create table public.session_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  log_date            date not null default current_date,
  interaction_count   int  not null default 0,
  mood_label          text,    -- 'cheerful'|'neutral'|'sad'|'anxious'|'tired'
  mood_score          smallint check (mood_score between 1 and 5),
  topics              text[] default '{}',  -- e.g. {'health','grandchildren','weather'}
  medication_taken    int     default 0,
  medication_missed   int     default 0,
  scam_checks         int     default 0,
  news_read           int     default 0,
  sos_triggered       boolean default false,
  summary             text,    -- one-line AI-generated summary
  created_at          timestamptz default now(),
  unique (user_id, log_date)
);

create index session_user_date_idx on public.session_logs(user_id, log_date desc);

alter table public.session_logs enable row level security;
create policy "session self read"  on public.session_logs for select using (auth.uid() = user_id);
create policy "session self write" on public.session_logs for insert with check (auth.uid() = user_id);
create policy "session self update" on public.session_logs for update using (auth.uid() = user_id);

-- =====================================================================
-- 5. MEDICATION SCHEDULES
-- =====================================================================
create table public.medication_schedules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  med_name        text not null,                 -- "降压药"
  dosage          text,                          -- "1 片"
  schedule_times  text[] not null,               -- {"08:00","14:00","20:00"}
  notes           text,                          -- "饭后服用"
  start_date      date default current_date,
  end_date        date,
  active          boolean not null default true,
  created_at      timestamptz default now()
);

create index medication_user_idx on public.medication_schedules(user_id) where active;

alter table public.medication_schedules enable row level security;
create policy "medication self read"  on public.medication_schedules for select using (auth.uid() = user_id);
create policy "medication self write" on public.medication_schedules for all    using (auth.uid() = user_id);

-- =====================================================================
-- 6. MEDICATION LOGS  (compliance)
-- =====================================================================
create type public.med_status as enum ('taken', 'missed', 'skipped', 'late');

create table public.medication_logs (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.medication_schedules(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status       public.med_status not null,
  taken_at     timestamptz,
  created_at   timestamptz default now()
);

create index medlog_user_time_idx on public.medication_logs(user_id, scheduled_at desc);

alter table public.medication_logs enable row level security;
create policy "medlog self read"  on public.medication_logs for select using (auth.uid() = user_id);
create policy "medlog self write" on public.medication_logs for insert with check (auth.uid() = user_id);

-- =====================================================================
-- 7. GUARDIANS  ─ secure family pairing
-- =====================================================================
create type public.guardian_role as enum ('primary', 'secondary', 'viewer');

create table public.guardians (
  id              uuid primary key default gen_random_uuid(),
  elder_id        uuid not null references public.profiles(id) on delete cascade,
  guardian_id     uuid not null references public.profiles(id) on delete cascade,
  role            public.guardian_role not null default 'secondary',
  pair_token      text unique not null default encode(gen_random_bytes(16), 'hex'),
  pair_accepted   boolean not null default false,
  paired_at       timestamptz default now(),
  revoked_at      timestamptz,
  unique (elder_id, guardian_id)
);

create index guardians_elder_idx    on public.guardians(elder_id)   where revoked_at is null;
create index guardians_guardian_idx on public.guardians(guardian_id) where revoked_at is null;

alter table public.guardians enable row level security;

-- The elder sees their own guardian list.
create policy "guardian elder read" on public.guardians
  for select using (auth.uid() = elder_id);
-- The guardian sees the row ONLY for pairs they've accepted.
create policy "guardian pair read" on public.guardians
  for select using (auth.uid() = guardian_id and pair_accepted);
-- Only the elder can create/revoke a pair.
create policy "guardian elder write" on public.guardians
  for all using (auth.uid() = elder_id);

-- Now backfill the profile FK.
alter table public.profiles
  add constraint profiles_primary_guardian_fk
  foreign key (primary_guardian_id) references public.guardians(id) on delete set null;

-- =====================================================================
-- 8. CRISIS EVENTS  ─ the "Exception Gate" for emergencies
-- =====================================================================
create type public.crisis_kind as enum (
  'sos_button', 'fall_detected', 'chest_pain_search', 'med_missed_critical',
  'no_activity_24h', 'manual_alert'
);

create table public.crisis_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          public.crisis_kind not null,
  latitude      double precision,
  longitude     double precision,
  payload       jsonb default '{}'::jsonb,
  resolved_at   timestamptz,
  guardian_notified boolean default false,
  created_at    timestamptz default now()
);

create index crisis_user_time_idx on public.crisis_events(user_id, created_at desc);

alter table public.crisis_events enable row level security;
create policy "crisis self read"  on public.crisis_events for select using (auth.uid() = user_id);
create policy "crisis self write" on public.crisis_events for insert with check (auth.uid() = user_id);

-- Guardian can READ crisis events for their elder (this is the privacy bypass).
create policy "crisis guardian read" on public.crisis_events
  for select using (
    exists (
      select 1 from public.guardians g
      where g.elder_id    = crisis_events.user_id
        and g.guardian_id = auth.uid()
        and g.pair_accepted
        and g.revoked_at is null
    )
  );

-- =====================================================================
-- 9. NEWS BOOKMARKS
-- =====================================================================
create table public.news_bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  url           text,
  summary       text,
  source        text,
  ai_score      numeric,   -- relevance 0-1
  created_at    timestamptz default now()
);

create index news_user_time_idx on public.news_bookmarks(user_id, created_at desc);

alter table public.news_bookmarks enable row level security;
create policy "news self all" on public.news_bookmarks
  for all using (auth.uid() = user_id);

-- =====================================================================
-- 10. SCAM REPORTS
-- =====================================================================
create type public.scam_verdict as enum ('safe', 'caution', 'danger');

create table public.scam_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  input_text    text not null,
  input_kind    text,                          -- 'sms' | 'url' | 'phone' | 'email'
  verdict       public.scam_verdict not null,
  confidence    numeric,
  reasoning     text,
  advice        text,
  created_at    timestamptz default now()
);

create index scam_user_time_idx on public.scam_reports(user_id, created_at desc);

alter table public.scam_reports enable row level security;
create policy "scam self all" on public.scam_reports for all using (auth.uid() = user_id);

-- =====================================================================
-- 11. FINANCE WATCHLIST
-- =====================================================================
create table public.finance_watchlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  symbol        text not null,           -- 'GC=F' (gold), 'SI=F' (silver), '000001.SS'
  display_name  text not null,
  asset_class   text not null,           -- 'gold' | 'silver' | 'index' | 'stock'
  created_at    timestamptz default now(),
  unique (user_id, symbol)
);

alter table public.finance_watchlist enable row level security;
create policy "finance self all" on public.finance_watchlist for all using (auth.uid() = user_id);

-- =====================================================================
-- REALTIME  ─ enable broadcast on the tables guardians watch
-- =====================================================================
alter publication supabase_realtime add table public.session_logs;
alter publication supabase_realtime add table public.crisis_events;
alter publication supabase_realtime add table public.medication_logs;

-- =====================================================================
-- TRIGGER  ─ auto-create profile + preferences on signup
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, phone_e164)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'display_name', '新用户'),
          new.phone);

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- GUARDIAN VIEW  ─ privacy-safe summary for the Guardian AI bridge
-- =====================================================================
-- Guardians see ONLY the last 7 days of aggregated mood/activity
-- metrics — never raw chats, never journal entries, never searches.
create or replace view public.guardian_elder_summary as
select
  g.guardian_id,
  g.elder_id      as user_id,
  p.display_name,
  p.preferred_name,
  s.log_date,
  s.mood_label,
  s.mood_score,
  s.medication_taken,
  s.medication_missed,
  s.interaction_count,
  s.topics
from public.guardians g
join public.profiles   p on p.id = g.elder_id
left join public.session_logs s
       on s.user_id = g.elder_id
      and s.log_date >= current_date - interval '7 days'
where g.pair_accepted
  and g.revoked_at is null;

-- Guardian-side RLS: a guardian can read the summary only for their own elders.
alter view public.guardian_elder_summary set (security_invoker = on);

-- =====================================================================
-- DONE.  Reminder:  -- replace-me Placeholders below for storage bucket.
-- =====================================================================

-- Storage bucket for medical reports (PDFs / images) — created via dashboard
-- or run:
--   insert into storage.buckets (id, name, public)
--   values ('medical-reports', 'medical-reports', false)
--   on conflict do nothing;
