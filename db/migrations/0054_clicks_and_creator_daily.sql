-- Traceability step 4 (docs/TRACEABILITY.md): taps that leave the site (map, website, tickets, LINE...) from a place,
-- อีเวนต์, ตี้ or challenge page, and how often a sponsored card was seen and tapped. Counted per Bangkok day for
-- everyone, signed in or not, with no record of who; signed-in members' taps also go to app.action_log (who brought them).
-- Written by POST /api/track (lib/social/linkClicks.ts). One small row per target, kind and day; kept for good.
create table app.link_clicks_daily (
  day         date not null,
  kind        text not null check (kind in ('map', 'website', 'ticket', 'line', 'facebook', 'instagram', 'tiktok', 'phone', 'online', 'other', 'sponsored_view', 'sponsored_click')),
  target_type text not null check (target_type in ('spot', 'community', 'fair', 'challenge')),
  target_ref  text not null check (char_length(target_ref) <= 120),
  clicks      integer not null default 0 check (clicks >= 0),
  primary key (target_type, target_ref, kind, day)
);
create index link_clicks_daily_day_idx on app.link_clicks_daily (day);

comment on table app.link_clicks_daily is 'Taps leaving the site, and sponsored card views and taps, per target and Asia/Bangkok day. Nobody is identified.';

alter table app.link_clicks_daily enable row level security;
alter table app.link_clicks_daily force row level security;
create policy runtime_all on app.link_clicks_daily to app_runtime using (true) with check (true);
grant select, insert, update on app.link_clicks_daily to app_runtime;

-- Admin numbers that stay quick with hundreds of thousands of members: the hourly job (lib/social/creatorDaily.ts)
-- recomputes today and yesterday from app.action_log and app.moment_daily_views into one row per creator per Bangkok
-- day, and /admin reads only this table. "people" and the action columns are different members that day, so a range adds
-- up person-days, the same way views do.
create table app.creator_daily (
  day             date not null,
  member_id       uuid not null references app.members (id) on delete cascade,
  people          integer not null default 0,
  visits          integer not null default 0,
  joins           integer not null default 0,
  saves           integer not null default 0,
  invite_yes      integer not null default 0,
  challenge_joins integer not null default 0,
  outbound        integer not null default 0,
  views           integer not null default 0,
  posts_seen      integer not null default 0,
  primary key (day, member_id)
);
create index creator_daily_member_idx on app.creator_daily (member_id, day);

comment on table app.creator_daily is 'Per creator per Asia/Bangkok day: people brought (by action) and post viewer-days. Rebuilt hourly for today and yesterday.';

alter table app.creator_daily enable row level security;
alter table app.creator_daily force row level security;
create policy runtime_all on app.creator_daily to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.creator_daily to app_runtime;

-- The hourly rebuild reads one day of the log at a time
create index action_log_created_idx on app.action_log (created_at);
