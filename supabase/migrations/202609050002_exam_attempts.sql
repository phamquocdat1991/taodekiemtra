create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.exam_rooms(id) on delete cascade,
  client_nonce uuid not null,
  student_name text not null,
  status text not null default 'in_progress',
  answers jsonb not null default '{}'::jsonb,
  result jsonb,
  score numeric(5, 2),
  score_percent smallint,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint exam_attempts_unique_client unique (room_id, client_nonce),
  constraint exam_attempts_student_name check (char_length(trim(student_name)) between 2 and 100),
  constraint exam_attempts_status check (status in ('in_progress', 'submitted', 'timed_out')),
  constraint exam_attempts_answers_object check (jsonb_typeof(answers) = 'object'),
  constraint exam_attempts_result_object check (result is null or jsonb_typeof(result) = 'object'),
  constraint exam_attempts_score check (score is null or score between 0 and 10),
  constraint exam_attempts_score_percent check (score_percent is null or score_percent between 0 and 100),
  constraint exam_attempts_submission_state check (
    (status = 'in_progress' and submitted_at is null)
    or (status in ('submitted', 'timed_out') and submitted_at is not null)
  )
);

create index exam_attempts_room_idx
  on public.exam_attempts (room_id);

create index exam_attempts_room_submitted_idx
  on public.exam_attempts (room_id, submitted_at desc)
  where submitted_at is not null;

create table private.exam_attempt_tokens (
  attempt_id uuid primary key references public.exam_attempts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint exam_attempt_tokens_hash_length check (char_length(token_hash) = 64)
);

create index exam_attempt_tokens_expiry_idx
  on private.exam_attempt_tokens (expires_at);

alter table public.exam_attempts enable row level security;

create policy "Giáo viên xem lượt thi trong phòng của mình"
  on public.exam_attempts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.exam_rooms as room
      where room.id = exam_attempts.room_id
        and room.teacher_id = (select auth.uid())
    )
  );

revoke all on table public.exam_attempts from anon, authenticated;
grant select on table public.exam_attempts to authenticated;

revoke all on table private.exam_attempt_tokens from public, anon, authenticated;
grant select, insert, update, delete on table private.exam_attempt_tokens to service_role;

