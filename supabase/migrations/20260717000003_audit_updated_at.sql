-- =====================================================================
-- 20260717000003 — Audit `updated_at` on core tables
-- =====================================================================
-- crisis_events, chat_history and guardians have no updated_at column, so
-- we can't tell when a row last changed (e.g. when a guardian resolved a
-- crisis, or when a pairing was last touched). ai_credits already maintains
-- updated_at via its RPCs. This migration adds the column + a BEFORE UPDATE
-- trigger to the three tables. It is idempotent (columns only added if
-- missing) so re-running is safe.

create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crisis_events'
      and column_name = 'updated_at'
  ) then
    alter table public.crisis_events add column updated_at timestamptz default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_history'
      and column_name = 'updated_at'
  ) then
    alter table public.chat_history add column updated_at timestamptz default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'guardians'
      and column_name = 'updated_at'
  ) then
    alter table public.guardians add column updated_at timestamptz default now();
  end if;
end $$;

drop trigger if exists crisis_events_updated_at on public.crisis_events;
create trigger crisis_events_updated_at
  before update on public.crisis_events
  for each row execute function public.set_updated_at();

drop trigger if exists chat_history_updated_at on public.chat_history;
create trigger chat_history_updated_at
  before update on public.chat_history
  for each row execute function public.set_updated_at();

drop trigger if exists guardians_updated_at on public.guardians;
create trigger guardians_updated_at
  before update on public.guardians
  for each row execute function public.set_updated_at();
