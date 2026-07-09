-- Simplified migration for Supabase free tier (no pgvector)
-- Full pgvector migration is in supabase/migrations/20260708000000_init.sql
-- Enable pgvector via Dashboard → Database → Extensions → vector

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Types
create type public.elder_mobility as enum ('independent', 'cane', 'walker', 'wheelchair');
create type public.elder_hearing as enum ('normal', 'mild', 'moderate', 'severe');
create type public.guardian_role as enum ('primary', 'secondary', 'viewer');
create type public.crisis_kind as enum ('sos_button', 'fall_detected', 'chest_pain_search', 'med_missed_critical', 'no_activity_24h', 'manual_alert');
create type public.med_status as enum ('taken', 'missed', 'skipped', 'late');
create type public.scam_verdict as enum ('safe', 'caution', 'danger');

-- 1. profiles
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null default '新用户',
  preferred_name      text,
  phone_e164          text unique,
  birth_date          date,
  city                text,
  mobility            public.elder_mobility default 'independent',
  hearing             public.elder_hearing   default 'normal',
  emergency_contact   text,
  primary_guardian_id uuid,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profile self read"  on public.profiles for select using (auth.uid() = id);
create policy "profile self write" on public.profiles for update using (auth.uid() = id);
create policy "profile self insert" on public.profiles for insert with check (auth.uid() = id);

-- 2. user_preferences
create table if not exists public.user_preferences (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  big_text_mode      boolean not null default true,
  dark_mode          boolean not null default false,
  language           text    not null default 'zh',
  voice_speed        numeric not null default 0.9,
  haptics_enabled    boolean not null default true,
  audio_cues_enabled boolean not null default true,
  updated_at         timestamptz default now()
);
alter table public.user_preferences enable row level security;
create policy "prefs self read"  on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs self write" on public.user_preferences for update using (auth.uid() = user_id);
create policy "prefs self insert" on public.user_preferences for insert with check (auth.uid() = user_id);

-- 3. memory_embeddings (text instead of vector for now)
create table if not exists public.memory_embeddings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  embedding   text,
  category    text not null default 'general',
  importance  smallint not null default 5 check (importance between 1 and 10),
  source      text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists memory_user_idx on public.memory_embeddings(user_id);
alter table public.memory_embeddings enable row level security;
create policy "memory self read"   on public.memory_embeddings for select using (auth.uid() = user_id);
create policy "memory self write"  on public.memory_embeddings for insert with check (auth.uid() = user_id);
create policy "memory self delete" on public.memory_embeddings for delete using (auth.uid() = user_id);

-- 4. session_logs
create table if not exists public.session_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  log_date            date not null default current_date,
  interaction_count   int  not null default 0,
  mood_label          text,
  mood_score          smallint check (mood_score between 1 and 5),
  topics              text[] default '{}',
  medication_taken    int     default 0,
  medication_missed   int     default 0,
  scam_checks         int     default 0,
  news_read           int     default 0,
  sos_triggered       boolean default false,
  summary             text,
  created_at          timestamptz default now(),
  unique (user_id, log_date)
);
create index if not exists session_user_date_idx on public.session_logs(user_id, log_date desc);
alter table public.session_logs enable row level security;
create policy "session self read"  on public.session_logs for select using (auth.uid() = user_id);
create policy "session self write" on public.session_logs for insert with check (auth.uid() = user_id);
create policy "session self update" on public.session_logs for update using (auth.uid() = user_id);

-- 5. medication_schedules
create table if not exists public.medication_schedules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  med_name        text not null,
  dosage          text,
  schedule_times  text[] not null,
  notes           text,
  start_date      date default current_date,
  end_date        date,
  active          boolean not null default true,
  created_at      timestamptz default now()
);
create index if not exists medication_user_idx on public.medication_schedules(user_id) where active;
alter table public.medication_schedules enable row level security;
create policy "medication self read"  on public.medication_schedules for select using (auth.uid() = user_id);
create policy "medication self write" on public.medication_schedules for all    using (auth.uid() = user_id);

-- 6. medication_logs
create table if not exists public.medication_logs (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.medication_schedules(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status       public.med_status not null,
  taken_at     timestamptz,
  created_at   timestamptz default now()
);
create index if not exists medlog_user_time_idx on public.medication_logs(user_id, scheduled_at desc);
alter table public.medication_logs enable row level security;
create policy "medlog self read"  on public.medication_logs for select using (auth.uid() = user_id);
create policy "medlog self write" on public.medication_logs for insert with check (auth.uid() = user_id);

-- 7. guardians
create table if not exists public.guardians (
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
create index if not exists guardians_elder_idx    on public.guardians(elder_id)   where revoked_at is null;
create index if not exists guardians_guardian_idx on public.guardians(guardian_id) where revoked_at is null;
alter table public.guardians enable row level security;
create policy "guardian elder read" on public.guardians for select using (auth.uid() = elder_id);
create policy "guardian pair read" on public.guardians for select using (auth.uid() = guardian_id and pair_accepted);
create policy "guardian elder write" on public.guardians for all using (auth.uid() = elder_id);

-- 8. crisis_events
create table if not exists public.crisis_events (
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
create index if not exists crisis_user_time_idx on public.crisis_events(user_id, created_at desc);
alter table public.crisis_events enable row level security;
create policy "crisis self read"  on public.crisis_events for select using (auth.uid() = user_id);
create policy "crisis self write" on public.crisis_events for insert with check (auth.uid() = user_id);

-- 9. news_bookmarks
create table if not exists public.news_bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  url           text,
  summary       text,
  source        text,
  ai_score      numeric,
  created_at    timestamptz default now()
);
create index if not exists news_user_time_idx on public.news_bookmarks(user_id, created_at desc);
alter table public.news_bookmarks enable row level security;
create policy "news self all" on public.news_bookmarks for all using (auth.uid() = user_id);

-- 10. scam_reports
create table if not exists public.scam_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  input_text    text not null,
  input_kind    text,
  verdict       public.scam_verdict not null,
  confidence    numeric,
  reasoning     text,
  advice        text,
  created_at    timestamptz default now()
);
create index if not exists scam_user_time_idx on public.scam_reports(user_id, created_at desc);
alter table public.scam_reports enable row level security;
create policy "scam self all" on public.scam_reports for all using (auth.uid() = user_id);

-- 11. finance_watchlist
create table if not exists public.finance_watchlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  symbol        text not null,
  display_name  text not null,
  asset_class   text not null,
  created_at    timestamptz default now(),
  unique (user_id, symbol)
);
alter table public.finance_watchlist enable row level security;
create policy "finance self all" on public.finance_watchlist for all using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.session_logs;
alter publication supabase_realtime add table public.crisis_events;
alter publication supabase_realtime add table public.medication_logs;

-- Trigger: auto-create profile + preferences on signup
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();