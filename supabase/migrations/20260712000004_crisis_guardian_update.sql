-- =====================================================================
-- 20260712000004 — Guardian crisis resolution + anonymous AI cap
-- =====================================================================

-- 1) Anonymous AI chat rate-limit table.
--    The llm-chat Edge Function now accepts requests with no auth token
--    (mirroring the management app's always-available AI). To keep the
--    open endpoint from being abused we tally anonymous requests per IP
--    per day. The function uses the service-role key, which bypasses RLS,
--    so no policies are required here.
create table if not exists public.ai_anon_usage (
  ip          text        not null,
  day         date        not null,
  count       integer     not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  primary key (ip, day)
);
create index if not exists ai_anon_usage_day_idx on public.ai_anon_usage(day);

-- 2) Allow a paired guardian to RESOLVE (acknowledge) a crisis event they
--    monitor. This powers the guardian "I Responded" button on the live
--    emergency popup, mirroring the management app's panic-ack flow. The
--    read policy already lets guardians SEE their elder's events; this adds
--    the ability to mark them resolved.
create policy "crisis guardian update" on public.crisis_events
  for update using (
    exists (
      select 1 from public.guardians g
      where g.elder_id    = crisis_events.user_id
        and g.guardian_id = auth.uid()
        and g.pair_accepted
        and g.revoked_at is null
    )
  )
  with check (true);
