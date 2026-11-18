-- Circles numbers (BE-420, owner 2026-11-18): which Circles people open and what they do there, so the row can keep
-- what works. One row per Bangkok day, member, Circle kind and event: a member counts once a day however often they
-- tap, and the admin reads "people", never raw taps. Rows older than 180 days are dropped by lib/social/circleStats.ts.
create table if not exists app.circle_events (
  day         date not null,
  member_id   uuid not null references app.members (id) on delete cascade,
  circle_kind text not null check (circle_kind in ('finish', 'step', 'doing', 'challenge', 'group')),
  event       text not null check (event in ('open', 'cheer', 'try', 'together', 'invite', 'view_post')),
  primary key (day, circle_kind, event, member_id)
);
create index if not exists circle_events_day_idx on app.circle_events (day);
grant select, insert, delete on app.circle_events to app_runtime;
