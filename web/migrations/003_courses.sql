create table if not exists courses (
  id text primary key,
  clerk_id text not null references users(clerk_id) on delete cascade,
  title text not null,
  subject text not null,
  difficulty text not null,
  description text not null default '',
  source_mode text not null check (source_mode in ('topic', 'upload')),
  source_ids jsonb not null default '[]'::jsonb,
  knowledge_base_name text,
  deeptutor_session_id text not null,
  deeptutor_status text not null default 'initialized',
  current_lesson_index integer not null default 0,
  current_lesson_id text,
  guide_payload jsonb not null default '{}'::jsonb,
  backend_mode text not null default 'live' check (backend_mode in ('live', 'stub')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_clerk_updated_idx
  on courses (clerk_id, updated_at desc);

create table if not exists course_exercises (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  clerk_id text not null references users(clerk_id) on delete cascade,
  lesson_id text not null,
  exercise_payload jsonb not null,
  backend_mode text not null default 'live' check (backend_mode in ('live', 'stub')),
  created_at timestamptz not null default now()
);

create index if not exists course_exercises_lookup_idx
  on course_exercises (clerk_id, course_id, lesson_id, created_at desc);
