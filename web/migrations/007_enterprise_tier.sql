alter table users
  drop constraint if exists users_tier_check;

alter table users
  add constraint users_tier_check
  check (tier in ('free', 'pro', 'team', 'enterprise'));
