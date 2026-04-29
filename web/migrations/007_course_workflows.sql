create table if not exists course_attempts (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  clerk_id text not null references users(clerk_id) on delete cascade,
  workflow_kind text not null check (workflow_kind in ('lesson', 'review', 'project')),
  lesson_id text,
  unit_id text,
  selected_option_id text,
  is_correct boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists course_attempts_lookup_idx
  on course_attempts (clerk_id, course_id, workflow_kind, created_at desc);

create table if not exists course_project_submissions (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  clerk_id text not null references users(clerk_id) on delete cascade,
  unit_id text not null,
  response text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  confidence integer not null default 50,
  status text not null default 'submitted' check (status in ('submitted', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists course_project_submissions_unique_idx
  on course_project_submissions (clerk_id, course_id, unit_id);
