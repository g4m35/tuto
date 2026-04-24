create table if not exists stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz,
  status text not null check (status in ('processing', 'processed', 'failed')),
  error text,
  attempts integer not null default 1 check (attempts > 0),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_status_updated_idx
  on stripe_webhook_events (status, updated_at desc);
