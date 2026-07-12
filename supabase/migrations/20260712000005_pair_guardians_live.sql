-- =====================================================================
-- 20260712000005 — Make pairing write LIVE data into the guardians table
-- =====================================================================
-- The pair_with_elder() RPC previously only updated profiles
-- (elder_account_id / guardian_account_id). But the crisis_events guardian
-- READ/UPDATE RLS policies — and the notify-guardian Edge Function — both
-- rely on the `guardians` table actually containing the link. Because the
-- RPC never inserted there, the guardians table stayed empty and the
-- guardian's "live emergency alert" query was silently filtered to ZERO
-- rows by RLS. This migration makes the RPC also insert/upsert the live
-- guardians row so the whole guardian-alert path works.

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

  -- Link both directions on profiles (kept for backwards-compat / Me screen).
  update public.profiles set elder_account_id = v_elder::text where id = v_guardian;
  update public.profiles set guardian_account_id = v_guardian::text where id = v_elder;

  -- LIVE link in the guardians table so RLS + notify-guardian can see it.
  insert into public.guardians (elder_id, guardian_id, pair_accepted)
  values (v_elder, v_guardian, true)
  on conflict (elder_id, guardian_id)
  do update set pair_accepted = true, revoked_at = null, paired_at = now();

  return jsonb_build_object('ok', true, 'elder_id', v_elder, 'guardian_id', v_guardian);
end;
$$;

grant execute on function public.pair_with_elder(text) to authenticated;

-- Helper used by the client to unpair: revoke (don't delete) the live row so
-- history is preserved and RLS stops matching it immediately.
create or replace function public.unpair_elder(p_elder uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_guardian uuid := auth.uid();
begin
  if v_guardian is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  update public.guardians
     set revoked_at = now()
   where elder_id = p_elder
     and guardian_id = v_guardian
     and revoked_at is null;

  update public.profiles set guardian_account_id = null where id = p_elder;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.unpair_elder(uuid) to authenticated;
