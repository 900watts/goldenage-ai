-- Migration: Add ai_reason column to crisis_events
-- The column already exists in production (added directly), but no migration
-- file was committed. This closes the gap so future environments match.
-- Uses IF NOT EXISTS so it's safe to run on databases that already have it.

alter table public.crisis_events
  add column if not exists ai_reason text;

comment on column public.crisis_events.ai_reason is
  'Brief AI-generated description of why SOS was triggered (e.g. "User reported bleeding"). NULL for manual button presses.';
