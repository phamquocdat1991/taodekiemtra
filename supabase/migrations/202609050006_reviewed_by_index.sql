create index exam_attempts_reviewed_by_idx
  on public.exam_attempts (reviewed_by)
  where reviewed_by is not null;
