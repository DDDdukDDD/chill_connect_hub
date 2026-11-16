-- A ตี้ sign-up kept until the member confirms their email (BE-392, owner 2026-11-16). It holds no seat and the host
-- does not see it; confirming the email turns it into a real join if a seat is still free (lib/social/pendingJoins.ts).
-- event_id is the ตี้ the member pressed (for a recurring ตี้, the series) and meet_date the date they picked.
create table app.pending_joins (
  event_id   uuid not null references app.events (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  meet_date  date,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);
create index pending_joins_member_idx on app.pending_joins (member_id);

alter table app.pending_joins enable row level security;
alter table app.pending_joins force row level security;
create policy runtime_all on app.pending_joins to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.pending_joins to app_runtime;
