alter table public.exam_attempts
  add column review_status text not null default 'not_required',
  add column ai_review jsonb,
  add column teacher_review jsonb,
  add column reviewed_by uuid references auth.users(id),
  add column reviewed_at timestamptz,
  add column published_at timestamptz,
  add constraint exam_attempts_review_status check (
    review_status in ('not_required', 'pending_ai', 'pending_teacher', 'approved', 'published')
  ),
  add constraint exam_attempts_ai_review_object check (
    ai_review is null or jsonb_typeof(ai_review) = 'object'
  ),
  add constraint exam_attempts_teacher_review_object check (
    teacher_review is null or jsonb_typeof(teacher_review) = 'object'
  ),
  add constraint exam_attempts_ai_review_required check (
    review_status not in ('pending_teacher', 'approved', 'published')
    or ai_review is not null
  ),
  add constraint exam_attempts_teacher_approval check (
    (
      review_status in ('approved', 'published')
      and teacher_review is not null
      and reviewed_by is not null
      and reviewed_at is not null
    )
    or (
      review_status not in ('approved', 'published')
      and teacher_review is null
      and reviewed_by is null
      and reviewed_at is null
    )
  ),
  add constraint exam_attempts_publication check (
    (review_status = 'published' and published_at is not null)
    or (review_status <> 'published' and published_at is null)
  );

create index exam_attempts_pending_review_idx
  on public.exam_attempts (room_id, review_status, submitted_at desc)
  where review_status in ('pending_ai', 'pending_teacher');
