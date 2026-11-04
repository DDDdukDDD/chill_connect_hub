-- Web push (owner 2026-11-04): one row per device a member turned notifications on for. The endpoint is the device's
-- address at its push service, so a device that changes hands moves to the new member instead of getting a second row.

create table app.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references app.members (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  updated_at timestamptz not null default now()
);
create index push_subscriptions_member_idx on app.push_subscriptions (member_id);

alter table app.push_subscriptions enable row level security;
alter table app.push_subscriptions force row level security;
create policy runtime_all on app.push_subscriptions to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.push_subscriptions to app_runtime;
