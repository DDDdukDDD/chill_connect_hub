-- Rate limits shared by every server (lib/rateLimit.ts). Before this each server counted on its own, so the real
-- limit was looser than the number in the code. One row per key, a fixed window that restarts once it has passed.
create table app.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 1
);
create index rate_limits_window_idx on app.rate_limits (window_start);

alter table app.rate_limits enable row level security;
alter table app.rate_limits force row level security;
create policy runtime_all on app.rate_limits to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.rate_limits to app_runtime;
