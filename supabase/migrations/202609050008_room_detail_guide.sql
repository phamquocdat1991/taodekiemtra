alter table public.exam_rooms
  add column detail_guide jsonb,
  add constraint exam_rooms_detail_guide_object check (
    detail_guide is null or jsonb_typeof(detail_guide) = 'object'
  );
