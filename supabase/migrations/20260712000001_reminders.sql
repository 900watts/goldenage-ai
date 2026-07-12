-- =====================================================================
-- 12. REMINDERS  ─ user-set reminders driven by the AI assistant
-- =====================================================================
-- A user can ask the AI to "remind me to take aspirin in 2 hours", or
-- "every day at 8am remind me to call my daughter". The AI emits a
-- tool_call; the Edge Function writes a row here. The client polls
-- for due reminders and fires an in-app pop-up + browser notification.
create type public.reminder_kind as enum (
  'one_off',     -- fires once at fire_at
  'daily'        -- fires every day at time_of_day
);

create type public.reminder_status as enum (
  'scheduled',   -- not yet fired
  'fired',       -- already fired (one_off) or last fired (daily)
  'cancelled',   -- user cancelled
  'snoozed'      -- user snoozed; next_fire_at updated
);

create table public.reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  label           text not null,                -- "服用阿司匹林", "给女儿打电话"
  kind            public.reminder_kind not null,
  fire_at         timestamptz,                 -- one_off: when to fire
  time_of_day     text,                        -- daily: HH:MM (user-local)
  next_fire_at    timestamptz not null,        -- the next time to fire; updated when snoozed or fired
  status          public.reminder_status not null default 'scheduled',
  last_fired_at   timestamptz,                 -- daily: last fire time
  fire_count      int not null default 0,      -- how many times it has fired (daily: number of days)
  source          text not null default 'chat',-- 'chat' | 'manual' | 'medication_sync'
  created_at      timestamptz default now()
);

create index reminders_user_next_idx on public.reminders(user_id, next_fire_at)
  where status = 'scheduled';
create index reminders_user_status_idx on public.reminders(user_id, status);

alter table public.reminders enable row level security;
create policy "reminder self all" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: so other devices (e.g. mobile + web) can react when a reminder fires.
alter publication supabase_realtime add table public.reminders;