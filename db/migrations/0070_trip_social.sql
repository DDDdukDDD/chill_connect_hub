-- Trip stories, round 2 (owner 2026-11-27, docs/TRIPS_PLAN.md): readers answer a trip with a heart or a comment, the
-- author can lay a song under the story, and the site nudges the author during and after the trip.

-- A song from lib/media/musicLibrary.ts under the story; null = no music
alter table app.trips add column music_id text check (music_id is null or char_length(music_id) <= 60);
-- Reminders already sent (lib/trips/reminders.ts): the last trip day nudged, and the "tell the story" nudge after it
alter table app.trips add column nudged_on date;
alter table app.trips add column story_nudged boolean not null default false;

create table app.trip_likes (
  trip_id     uuid not null references app.trips (id) on delete cascade,
  member_id   uuid not null references app.members (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (trip_id, member_id)
);

create table app.trip_comments (
  id          uuid primary key,
  trip_id     uuid not null references app.trips (id) on delete cascade,
  member_id   uuid not null references app.members (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index trip_comments_trip_idx on app.trip_comments (trip_id, created_at);

alter table app.trip_likes enable row level security;
alter table app.trip_likes force row level security;
create policy runtime_all on app.trip_likes to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.trip_likes to app_runtime;

alter table app.trip_comments enable row level security;
alter table app.trip_comments force row level security;
create policy runtime_all on app.trip_comments to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.trip_comments to app_runtime;

-- Notices: a heart or comment on a trip, and the two reminders. A trip notice keeps the trip's page in `path`.
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going', 'plan_soon', 'plan_after', 'plan_together', 'invite_no', 'follow_along', 'cheer', 'trip_like', 'trip_comment', 'trip_day', 'trip_ended'));
