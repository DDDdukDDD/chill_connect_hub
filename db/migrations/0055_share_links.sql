-- Traceability step 5 (docs/TRACEABILITY.md): a shared post link carries who shared it (/moments/<id>?s=<member>).
-- Opening it is counted here per sharer, post and Bangkok day (nobody else named), and the browser remembers the share
-- for 30 days (cookie cw_share). Joining, going or signing up after it then logs two rows in app.action_log: one credited
-- to the sharer (source 'share'), one to the post's author (source 'moment'); which one is paid is decided later.
create table app.share_opens_daily (
  day        date not null,
  moment_id  uuid not null references app.moments (id) on delete cascade,
  sharer_id  uuid not null references app.members (id) on delete cascade,
  opens      integer not null default 0 check (opens >= 0),
  primary key (sharer_id, moment_id, day)
);
create index share_opens_daily_day_idx on app.share_opens_daily (day);
create index share_opens_daily_moment_idx on app.share_opens_daily (moment_id);

comment on table app.share_opens_daily is 'Opens of a shared post link, per sharer, post and Asia/Bangkok day (the opener is not recorded).';

alter table app.share_opens_daily enable row level security;
alter table app.share_opens_daily force row level security;
create policy runtime_all on app.share_opens_daily to app_runtime using (true) with check (true);
grant select, insert, update on app.share_opens_daily to app_runtime;

-- Signing up after a shared link is an action too, and its target is the post
alter table app.action_log drop constraint action_log_action_check;
alter table app.action_log add constraint action_log_action_check
  check (action in ('join', 'save', 'challenge_join', 'visit', 'invite_yes', 'outbound', 'sponsored_click', 'signup'));
alter table app.action_log drop constraint action_log_target_type_check;
alter table app.action_log add constraint action_log_target_type_check
  check (target_type in ('spot', 'community', 'fair', 'challenge', 'plan', 'link', 'slot', 'moment'));

-- Admin summary: sign-ups brought and shared-link opens
alter table app.creator_daily add column signups integer not null default 0;
alter table app.creator_daily add column share_opens integer not null default 0;
