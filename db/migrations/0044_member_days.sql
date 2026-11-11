-- Which days a member used Chillwaa signed in (owner 2026-11-11: "do people come back?"). One row per member and
-- Bangkok day, written the first time their session is read that day (lib/members/activeDays.ts). Read only as totals
-- in /admin (retention by sign-up week); no page shows one member's days.
create table app.member_days (
  member_id uuid not null references app.members (id) on delete cascade,
  day       date not null,
  primary key (member_id, day)
);
create index member_days_day_idx on app.member_days (day);

comment on table app.member_days is 'Days a member was active signed in, for retention totals in /admin. One row per member per Bangkok day.';

alter table app.member_days enable row level security;
alter table app.member_days force row level security;
create policy runtime_all on app.member_days to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.member_days to app_runtime;
