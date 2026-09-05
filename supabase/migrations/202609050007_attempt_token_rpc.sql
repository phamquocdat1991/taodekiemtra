create or replace function public.upsert_attempt_token(
  p_attempt_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.exam_attempt_tokens (attempt_id, token_hash, expires_at)
  values (p_attempt_id, p_token_hash, p_expires_at)
  on conflict (attempt_id) do update
    set token_hash = excluded.token_hash,
        expires_at = excluded.expires_at;
$$;

create or replace function public.validate_attempt_token(
  p_attempt_id uuid,
  p_token_hash text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.exam_attempt_tokens
    where attempt_id = p_attempt_id
      and token_hash = p_token_hash
      and expires_at > now()
  );
$$;

revoke all on function public.upsert_attempt_token(uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.validate_attempt_token(uuid, text)
  from public, anon, authenticated;

grant execute on function public.upsert_attempt_token(uuid, text, timestamptz)
  to service_role;
grant execute on function public.validate_attempt_token(uuid, text)
  to service_role;
