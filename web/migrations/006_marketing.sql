create table if not exists beta_signups (
  id bigserial primary key,
  email text not null,
  email_normalized text not null unique,
  name text,
  use_case text,
  material_type text,
  notes text,
  marketing_opt_in boolean not null default false,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_signups_created_at_idx on beta_signups (created_at desc);
create index if not exists beta_signups_use_case_idx on beta_signups (use_case);

create table if not exists marketing_events (
  id bigserial primary key,
  name text not null,
  distinct_id text not null,
  user_id text,
  source text,
  url text,
  referrer text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketing_events_name_created_at_idx
  on marketing_events (name, created_at desc);

create index if not exists marketing_events_distinct_id_idx
  on marketing_events (distinct_id);
