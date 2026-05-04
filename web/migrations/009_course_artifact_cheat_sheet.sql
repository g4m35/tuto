do $$
declare
  constraint_name text;
begin
  select conname
    into constraint_name
  from pg_constraint
  where conrelid = 'courses'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%artifact_kind%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table courses drop constraint %I', constraint_name);
  end if;
end $$;

alter table courses
  add constraint courses_artifact_kind_check
  check (artifact_kind in ('course', 'study-guide', 'slides', 'quiz-set', 'cheat-sheet', 'lesson-plan'));
