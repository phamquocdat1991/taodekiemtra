create extension if not exists pgcrypto;

create table public.exam_rooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  pin text not null,
  status text not null default 'open',
  config jsonb not null,
  exam jsonb not null,
  answer_key jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  constraint exam_rooms_pin_format check (pin ~ '^[A-HJ-NP-Z2-9]{6}$'),
  constraint exam_rooms_status check (status in ('draft', 'open', 'closed', 'expired')),
  constraint exam_rooms_config_object check (jsonb_typeof(config) = 'object'),
  constraint exam_rooms_exam_object check (jsonb_typeof(exam) = 'object'),
  constraint exam_rooms_answer_key_object check (jsonb_typeof(answer_key) = 'object'),
  constraint exam_rooms_expiry check (expires_at > created_at),
  constraint exam_rooms_closed_at check (
    (status in ('draft', 'open') and closed_at is null)
    or (status in ('closed', 'expired') and closed_at is not null)
  )
);

create index exam_rooms_teacher_created_idx
  on public.exam_rooms (teacher_id, created_at desc);

create unique index exam_rooms_open_pin_idx
  on public.exam_rooms (pin)
  where status = 'open';

create index exam_rooms_open_expiry_idx
  on public.exam_rooms (expires_at)
  where status = 'open';

alter table public.exam_rooms enable row level security;

create policy "Giáo viên xem phòng của mình"
  on public.exam_rooms
  for select
  to authenticated
  using ((select auth.uid()) = teacher_id);

create policy "Giáo viên tạo phòng của mình"
  on public.exam_rooms
  for insert
  to authenticated
  with check ((select auth.uid()) = teacher_id);

create policy "Giáo viên cập nhật phòng của mình"
  on public.exam_rooms
  for update
  to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);

create policy "Giáo viên xóa phòng của mình"
  on public.exam_rooms
  for delete
  to authenticated
  using ((select auth.uid()) = teacher_id);

revoke all on table public.exam_rooms from anon, authenticated;
grant select, insert, update, delete on table public.exam_rooms to authenticated;

