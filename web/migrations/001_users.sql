create table if not exists users (
  clerk_id text primary key,
  stripe_customer_id text unique,
  tier text not null default 'free' check (tier in ('free', 'pro', 'team')),
  subscription_status text not null default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists users_stripe_customer_id_idx on users (stripe_customer_id);
