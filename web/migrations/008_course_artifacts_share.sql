alter table courses
  add column if not exists artifact_kind text not null default 'course'
    check (artifact_kind in ('course', 'study-guide', 'slides', 'quiz-set', 'cheat-sheet', 'lesson-plan'));

alter table courses
  add column if not exists share_token text,
  add column if not exists share_enabled boolean not null default false,
  add column if not exists shared_at timestamptz;

create unique index if not exists courses_share_token_idx
  on courses (share_token)
  where share_token is not null;

create index if not exists courses_public_share_lookup_idx
  on courses (share_token)
  where share_enabled = true;
