-- =====================================================================
-- 20260712000006 — Make the onboarding wizard's "Guardian Account ID"
-- entry actually establish the LIVE guardians link.
-- =====================================================================
-- Root cause of "guardian sees no SOS reaction":
--   The elder onboarding wizard only wrote profile.guardian_account_id
--   and never created a `guardians` row. The crisis_events guardian
--   READ/UPDATE RLS policies REQUIRE that row, so the guardian's query
--   was silently filtered to ZERO rows → no alert.
--
--   pair_with_elder() is the GUARDIAN-initiated path (guardian enters the
--   elder's code). But the wizard lets the ELDER enter the GUARDIAN's ID,
--   which is the reverse direction. This new function covers that case:
--   the caller is the elder; it links guardian_id = the entered account.
--
-- Both functions upsert the same (elder_id, guardian_id) unique row, so
-- pairing works no matter who initiates.

create or replace function public.link_my_guardian(p_guardian text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_elder    uuid := auth.uid();
  v_guardian uuid := null;
begin
  if v_elder is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  select id into v_guardian
    from public.profiles
   where id::text = p_guardian
      or pairing_code = p_guardian
   limit 1;

  if v_guardian is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_guardian = v_elder then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;

  -- Mirror both profile links for the Me screen / backwards-compat.
  update public.profiles set guardian_account_id = v_guardian::text where id = v_elder;
  update public.profiles set elder_account_id    = v_elder::text    where id = v_guardian;

  -- THE LIVE LINK: this is what makes RLS + notify-guardian work.
  insert into public.guardians (elder_id, guardian_id, pair_accepted)
  values (v_elder, v_guardian, true)
  on conflict (elder_id, guardian_id)
  do update set pair_accepted = true, revoked_at = null, paired_at = now();

  return jsonb_build_object('ok', true, 'elder_id', v_elder, 'guardian_id', v_guardian);
end;
$$;

grant execute on function public.link_my_guardian(text) to authenticated;
