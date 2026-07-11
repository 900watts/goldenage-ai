-- =====================================================================
-- GoldenAge AI — Role + guardian/elderly pairing
-- =====================================================================
-- Adds the "are you the elderly (protected) or the guardian?" model:
--   * role                 -> 'elderly' | 'guardian'
--   * pairing_code         -> short shareable code the elder gives the guardian
--   * elder_account_id     -> for a guardian: the linked elder's Supabase id
--   * guardian_account_id  -> for an elder: the linked guardian's Supabase id
-- Each Supabase auth user already HAS a unique account id (auth.users.id);
-- the guardian pairs by entering the elder's pairing_code OR that account id.

alter table public.profiles
  add column if not exists role text
    check (role is null or role in ('elderly','guardian'));

alter table public.profiles
  add column if not exists pairing_code text unique;

alter table public.profiles
  add column if not exists elder_account_id text;

alter table public.profiles
  add column if not exists guardian_account_id text;

create index if not exists profiles_pairing_code_idx
  on public.profiles (pairing_code);

-- ---------------------------------------------------------------------
-- pair_with_elder(p_code)
-- Called by the guardian's session. Resolves the elder by pairing_code OR
-- by account id, then links both rows (bypasses RLS via security definer).
-- ---------------------------------------------------------------------
create or replace function public.pair_with_elder(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_elder    uuid := null;
  v_guardian uuid := auth.uid();
begin
  if v_guardian is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  select id into v_elder
    from public.profiles
   where pairing_code = p_code
      or id::text = p_code
   limit 1;

  if v_elder is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_elder = v_guardian then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;

  -- Link both directions.
  update public.profiles set elder_account_id = v_elder::text where id = v_guardian;
  update public.profiles set guardian_account_id = v_guardian::text where id = v_elder;

  return jsonb_build_object('ok', true, 'elder_id', v_elder, 'guardian_id', v_guardian);
end;
$$;

grant execute on function public.pair_with_elder(text) to authenticated;
