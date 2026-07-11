-- =====================================================================
-- GoldenAge AI — Profile setup flag
-- =====================================================================
-- Adds a `setup_complete` column to profiles so the app can detect
-- whether a freshly-created auth user has finished the name / personal
-- info onboarding step. New users start with setup_complete = false and
-- the app flips it to true once they submit the setup form.

alter table public.profiles
  add column if not exists setup_complete boolean not null default false;

-- Backfill: anyone who already has a real (non-default) display name is
-- considered onboarded. The trigger default is '新用户', so we only flip
-- rows that already set a custom name.
update public.profiles
  set setup_complete = true
  where display_name is not null
    and display_name <> '新用户'
    and setup_complete = false;

create index if not exists profiles_setup_idx
  on public.profiles (setup_complete);
