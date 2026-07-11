-- =====================================================================
-- AI credits system: per-user daily budget, resets at user's local
-- midnight (we store the offset; the reset itself happens lazily on
-- next call after midnight).
-- =====================================================================

create table if not exists public.ai_credits (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  credits_remaining numeric not null default 50,
  credits_total     numeric not null default 50,
  reset_at          timestamptz not null,
  timezone_offset_minutes int not null default 480,  -- +08:00 fallback
  updated_at        timestamptz not null default now()
);

alter table public.ai_credits enable row level security;

drop policy if exists "ai_credits_select_own" on public.ai_credits;
create policy "ai_credits_select_own" on public.ai_credits
  for select using (auth.uid() = user_id);

-- No update/insert policy — clients go through the security-definer RPC.

-- =====================================================================
-- ai_credits_consume(p_user_id uuid, p_amount numeric, p_tz_offset_minutes int)
--
-- Atomically:
--   1. Lazily resets credits to credits_total if reset_at <= now()
--      (recomputes the next local midnight based on tz_offset_minutes).
--   2. If credits_remaining >= amount, decrements and returns the
--      remaining count. Otherwise returns -1 and does nothing.
--   3. If the user has no row yet, creates one with full credits.
--   4. Updates the timezone offset if the user has changed it (so the
--      next reset happens at their correct local midnight).
-- Returns: {ok bool, credits_remaining numeric, credits_total numeric,
--          reset_at timestamptz}
--
-- Security: this function is security-definer, so it runs with the
-- owner's privileges. Service-role can call it with any user_id. We
-- also grant execute to authenticated, in which case we force the
-- user_id to auth.uid() so users can only touch their own row.
-- =====================================================================
create or replace function public.ai_credits_consume(
  p_user_id uuid,
  p_amount numeric,
  p_tz_offset_minutes int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_row  public.ai_credits%rowtype;
  v_now  timestamptz := now();
  v_next_midnight_local timestamptz;
begin
  -- If the caller is an authenticated user (not service-role), force
  -- user_id to their own uid so they cannot consume someone else's credits.
  v_user := coalesce(p_user_id, auth.uid());
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  -- Compute next local-midnight for the user.
  -- Cast the int to text safely (||) before making the interval.
  v_next_midnight_local := (date_trunc('day', v_now at time zone 'utc' + (p_tz_offset_minutes::text || ' minutes')::interval)
                            + interval '1 day')
                           - (p_tz_offset_minutes::text || ' minutes')::interval;

  -- Fetch or insert the row.
  select * into v_row from public.ai_credits where user_id = v_user for update;
  if not found then
    insert into public.ai_credits(user_id, credits_remaining, credits_total, reset_at, timezone_offset_minutes)
    values (v_user, 50, 50, v_next_midnight_local, p_tz_offset_minutes)
    returning * into v_row;
  end if;

  -- Lazily reset if past reset_at.
  if v_row.reset_at <= v_now then
    update public.ai_credits
       set credits_remaining = credits_total,
           reset_at          = v_next_midnight_local,
           updated_at        = v_now
     where user_id = v_user
     returning * into v_row;
  end if;

  -- Update timezone if it changed.
  if v_row.timezone_offset_minutes is distinct from p_tz_offset_minutes then
    update public.ai_credits
       set timezone_offset_minutes = p_tz_offset_minutes,
           updated_at              = v_now
     where user_id = v_user;
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
      'reset_at',          v_row.reset_at
    );
  else
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'credits_remaining', v_row.credits_remaining,
      'credits_total',     v_row.credits_total,
      'reset_at',          v_row.reset_at
    );
  end if;
end;
$$;

grant execute on function public.ai_credits_consume(uuid, numeric, int) to authenticated;
grant execute on function public.ai_credits_consume(uuid, numeric, int) to service_role;

-- =====================================================================
-- ai_credits_read(p_user_id uuid)
--
-- Read current credits without consuming. Service-role can read any
-- user; authenticated can only read their own.
-- =====================================================================
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
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  select * into v_row from public.ai_credits where user_id = v_user;
  if not found then
    return jsonb_build_object('ok', true,
      'credits_remaining', 50, 'credits_total', 50,
      'reset_at', null, 'new_account', true);
  end if;
  if v_row.reset_at <= v_now then
    return jsonb_build_object('ok', true,
      'credits_remaining', v_row.credits_total, 'credits_total', v_row.credits_total,
      'reset_at', v_row.reset_at, 'pending_reset', true);
  end if;
  return jsonb_build_object('ok', true,
    'credits_remaining', v_row.credits_remaining, 'credits_total', v_row.credits_total,
    'reset_at', v_row.reset_at);
end;
$$;

grant execute on function public.ai_credits_read(uuid) to authenticated;
grant execute on function public.ai_credits_read(uuid) to service_role;