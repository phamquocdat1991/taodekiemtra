do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'exam_attempts'
  ) then
    alter publication supabase_realtime add table public.exam_attempts;
  end if;
end
$$;

