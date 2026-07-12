-- =====================================================================
-- GoldenAge AI — persistent chat history
-- =====================================================================
-- Every AI conversation turn is stored here so a paired guardian can later
-- ask "how's the elder been?" and the Edge Function can pull the elder's
-- recent chat history from Supabase and summarize it via the LLM.
--
--   * The chatting user writes their own rows (self RLS).
--   * A guardian may READ the elder's rows, resolved through the elder's
--     profile.guardian_account_id link (set by pair_with_elder()).
--   * The Edge Function reads with the service role, so it always bypasses
--     RLS and can fetch the elder's history for the guardian summary.

create table if not exists public.chat_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  session_id  uuid,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists chat_user_time_idx
  on public.chat_history (user_id, created_at desc);

alter table public.chat_history enable row level security;

-- The chatting user owns their own history.
create policy "chat self all" on public.chat_history
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A guardian can READ the elder's chat history. The elder's profile carries
-- guardian_account_id (the guardian's auth id as text); we match on that.
create policy "chat guardian read" on public.chat_history
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = chat_history.user_id
        and p.guardian_account_id = auth.uid()::text
    )
  );
