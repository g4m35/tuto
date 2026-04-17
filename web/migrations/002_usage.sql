do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'usage_event_type'
  ) then
    create type usage_event_type as enum ('message', 'doc_upload', 'course_created');
  end if;
end
$$;

create table if not exists usage_events (
  id bigserial primary key,
  clerk_id text not null references users(clerk_id) on delete cascade,
  event_type usage_event_type not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists usage_events_clerk_event_created_idx
  on usage_events (clerk_id, event_type, created_at desc);
