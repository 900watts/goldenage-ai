-- =====================================================================
-- 20260720000001 — get_my_guardian() RPC
-- =====================================================================
-- Lets the *elder* (any signed-in user) look up the display_name of the
-- user who is currently their guardian. profiles RLS is self-only, so we
-- need a SECURITY DEFINER function to read across users safely.
--
-- Returns:
--   null                          -> caller has no guardian linked
--   { id, display_name }          -> the guardian's auth id and name
--
-- The function ONLY exposes a single row and a fixed shape, so it
-- cannot be abused as a profile-enumeration oracle.

create or replace function public.get_my_guardian()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_guardian_id text;
  v_name        text;
begin
  select guardian_account_id
    into v_guardian_id
    from public.profiles
    where id = auth.uid();

  if v_guardian_id is null or v_guardian_id = '' then
    return null;
  end if;

  -- Validate it's a real uuid before hitting profiles (elder profile stores
  -- the guardian's auth id as text).
  begin
    select display_name
      into v_name
      from public.profiles
      where id = v_guardian_id::uuid
      limit 1;
  exception when others then
    v_name := null;
  end;

  if v_name is null then
    return jsonb_build_object('id', v_guardian_id, 'display_name', null);
  end if;
  return jsonb_build_object('id', v_guardian_id, 'display_name', v_name);
end;
$$;

grant execute on function public.get_my_guardian() to authenticated;
