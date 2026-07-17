-- =====================================================================
-- 20260717000002 — Backend hardening (coordinated with Trae Work)
-- =====================================================================
-- 1) Tighten the guardian crisis-update policy. The previous policy used
--    `with check (true)`, which let a guardian rewrite ANY column of a row
--    they could see — including reassigning user_id to a different elder.
--    The new WITH CHECK requires the (possibly new) row to still belong to
--    an elder this guardian monitors, so they can only resolve/annotate
--    their own elder's events, never reassign them.
drop policy if exists "crisis guardian update" on public.crisis_events;
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
  with check (
    exists (
      select 1 from public.guardians g
      where g.elder_id    = crisis_events.user_id
        and g.guardian_id = auth.uid()
        and g.pair_accepted
        and g.revoked_at is null
    )
  );

-- 2) Make ai_credits_read consistent with the lowered 10/day cap (migration
--    20260717000001). New non-admin users should read 10/10 (admins 999999),
--    not the stale 50/50 hardcoded in the original function definition.
create or replace function public.ai_credits_read(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := coalesce(p_user_id, auth.uid());
  v_row  public.ai_credits%rowtype;
  v_now  timestamptz := now();
  v_is_admin boolean;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  select is_admin into v_is_admin from public.profiles where id = v_user;
  v_is_admin := coalesce(v_is_admin, false);

  select * into v_row from public.ai_credits where user_id = v_user;
  if not found then
    return jsonb_build_object(
      'ok', true,
      'credits_remaining', case when v_is_admin then 999999 else 10 end,
      'credits_total',     case when v_is_admin then 999999 else 10 end,
      'reset_at', null,
      'new_account', true,
      'is_admin', v_is_admin
    );
  end if;
  if v_row.reset_at <= v_now then
    return jsonb_build_object(
      'ok', true,
      'credits_remaining', v_row.credits_total,
      'credits_total',     v_row.credits_total,
      'reset_at', v_row.reset_at,
      'pending_reset', true,
      'is_admin', v_is_admin
    );
  end if;
  return jsonb_build_object(
    'ok', true,
    'credits_remaining', v_row.credits_remaining,
    'credits_total',     v_row.credits_total,
    'reset_at', v_row.reset_at,
    'is_admin', v_is_admin
  );
end;
$$;

grant execute on function public.ai_credits_read(uuid) to authenticated;
grant execute on function public.ai_credits_read(uuid) to service_role;
