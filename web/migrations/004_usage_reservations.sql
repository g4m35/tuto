do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'usage_reservation_status'
  ) then
    create type usage_reservation_status as enum ('reserved', 'committed', 'released', 'expired');
  end if;
end
$$;

create table if not exists usage_monthly_counters (
  clerk_id text not null references users(clerk_id) on delete cascade,
  event_type usage_event_type not null,
  period_start timestamptz not null,
  used integer not null default 0 check (used >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  primary key (clerk_id, event_type, period_start)
);

create table if not exists usage_reservations (
  id uuid primary key,
  clerk_id text not null references users(clerk_id) on delete cascade,
  event_type usage_event_type not null,
  period_start timestamptz not null,
  quantity integer not null default 1 check (quantity > 0),
  status usage_reservation_status not null default 'reserved',
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  released_at timestamptz
);

create index if not exists usage_reservations_active_idx
  on usage_reservations (clerk_id, event_type, period_start, expires_at)
  where status = 'reserved';

create index if not exists usage_reservations_status_idx
  on usage_reservations (status, expires_at);

alter table usage_events
  add column if not exists reservation_id uuid references usage_reservations(id),
  add column if not exists quantity integer not null default 1 check (quantity > 0);

insert into usage_monthly_counters (
  clerk_id,
  event_type,
  period_start,
  used,
  reserved,
  updated_at
)
select
  clerk_id,
  event_type,
  date_trunc('month', created_at at time zone 'utc') at time zone 'utc',
  count(*)::integer,
  0,
  now()
from usage_events
group by 1, 2, 3
on conflict (clerk_id, event_type, period_start)
do update set
  used = excluded.used,
  updated_at = now();
