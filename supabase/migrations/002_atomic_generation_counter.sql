-- FirmForge — Atomic generation counter increment
-- Prevents race condition where concurrent requests could bypass the daily limit.

-- Atomic increment: only increments if the user is on the free plan
-- Returns the NEW counter value after increment.
create or replace function public.increment_generations_today(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update profiles
     set generations_today = generations_today + 1
   where id = p_user_id
  returning generations_today into new_count;

  return coalesce(new_count, 0);
end;
$$;

-- Revoke direct execute from anon/authenticated — only service role calls this.
revoke execute on function public.increment_generations_today(uuid) from anon, authenticated;
grant execute on function public.increment_generations_today(uuid) to service_role;
