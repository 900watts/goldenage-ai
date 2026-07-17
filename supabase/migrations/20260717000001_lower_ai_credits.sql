-- =====================================================================
-- 20260717000001 — Lower daily AI cap to 10 + add admin exemption
-- =====================================================================
-- After the 2026-07-12 Hong Kong anonymous-abuse incident, the daily AI
-- credit cap is being lowered from 50 to 10 for non-admin users. The
-- project owner (Watts, user_id 8c010ee2-1038-4547-8ffe-35bcb6967aae)
-- is marked as admin and is exempt from the cap. Everyone else
-- (including the 67 test account) gets the 10/day limit.
-- =====================================================================

-- 1) Admin flag on profiles.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Mark the project owner as admin.
update public.profiles
   set is_admin = true
 where id = '8c010ee2-2380-47c3-beec-894e066d9cb1'::uuid;

-- 2) Lower the default AI cap.
alter table public.ai_credits
  alter column credits_total set default 10;

-- 3) For every existing ai_credits row, lower the total to 10 (but
--    never raise it) and clamp the remaining balance so today's
--    consumption is honored — i.e. a user who used 31 today now has
--    remaining=0, total=10 until the daily reset.
update public.ai_credits
   set credits_total = 10
 where credits_total > 10;

update public.ai_credits
   set credits_remaining = least(credits_remaining, 10)
 where credits_remaining > 10;

-- 4) Update the consume RPC to be admin-aware. Admins are exempt from
--    the credit cap entirely; their balance is still tracked but the
--    consume call always succeeds with no decrement. This is simpler
--    and more honest than showing "9999" to admin users.
create or replace function public.ai_credits_consume(
  p_user_id     uuid,
  p_amount      numeric,
  p_tz_offset_minutes int default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := coalesce(p_user_id, auth.uid());
  v_row     public.ai_credits%rowtype;
  v_now     timestamptz := now();
  v_next_midnight_local timestamptz;
  v_is_admin boolean;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  -- Check admin status once. Admins bypass the cap (still recorded).
  select is_admin into v_is_admin from public.profiles where id = v_user;
  v_is_admin := coalesce(v_is_admin, false);

  v_next_midnight_local := (date_trunc('day', v_now at time zone 'utc' + (p_tz_offset_minutes::text || ' minutes')::interval)
                            + interval '1 day')
                           - (p_tz_offset_minutes::text || ' minutes')::interval;

  select * into v_row from public.ai_credits where user_id = v_user for update;
  if not found then
    insert into public.ai_credits(user_id, credits_remaining, credits_total, reset_at, timezone_offset_minutes)
    values (v_user,
            case when v_is_admin then 999999 else 10 end,
            case when v_is_admin then 999999 else 10 end,
            v_next_midnight_local,
            p_tz_offset_minutes)
    returning * into v_row;
  end if;

  -- Lazily reset if past reset_at (admins too — we re-assert their big pool).
  if v_row.reset_at <= v_now then
    update public.ai_credits
       set credits_remaining = case when v_is_admin then 999999 else credits_total end,
           reset_at          = v_next_midnight_local,
           updated_at        = v_now
     where user_id = v_user
     returning * into v_row;
  end if;

  if v_row.timezone_offset_minutes is distinct from p_tz_offset_minutes then
    update public.ai_credits
       set timezone_offset_minutes = p_tz_offset_minutes,
           updated_at              = v_now
     where user_id = v_user;
  end if;

  -- ===== Admin fast-path =====
  -- Track but do not decrement; never block admin calls.
  if v_is_admin then
    return jsonb_build_object(
      'ok', true,
      'credits_remaining', 999999,
      'credits_total',     999999,
      'is_admin',          true,
      'reset_at',          v_row.reset_at
    );
  end if;

  -- Decrement if enough credits. Negative p_amount (refund) is allowed
  -- even when balance is 0, capped at 0.
  if p_amount < 0 then
    update public.ai_credits
       set credits_remaining = greatest(0, v_row.credits_remaining + p_amount),
           updated_at        = v_now
     where user_id = v_user
     returning * into v_row;
    return jsonb_build_object(
      'ok', true,
      'credits_remaining', v_row.credits_remaining,
      'credits_total',     v_row.credits_total,
      'is_admin',          false,
      'reset_at',          v_row.reset_at
    );
  elsif v_row.credits_remaining >= p_amount then
    update public.ai_credits
       set credits_remaining = v_row.credits_remaining - p_amount,
           updated_at        = v_now
     where user_id = v_user
     returning * into v_row;
    return jsonb_build_object(
      'ok', true,
      'credits_remaining', v_row.credits_remaining,
      'credits_total',     v_row.credits_total,
      'is_admin',          false,
      'reset_at',          v_row.reset_at
    );
  else
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'credits_remaining', v_row.credits_remaining,
      'credits_total',     v_row.credits_total,
      'is_admin',          false,
      'reset_at',          v_row.reset_at
    );
  end if;
end;
$$;

grant execute on function public.ai_credits_consume(uuid, numeric, int) to authenticated;
grant execute on function public.ai_credits_consume(uuid, numeric, int) to service_role;
