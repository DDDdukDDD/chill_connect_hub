-- Traceability step 3 (docs/TRACEABILITY.md): how many different signed-in members saw each post, per Bangkok day.
-- app.moment_seen keeps only the latest sighting and is cleared after 30 days, so a creator's reach was lost over time.
-- lib/moments/pgMomentRepository.ts markSeen adds to this table in the same statement that records a sighting: a member
-- counts once per post per day, and the author's own views do not count. Kept for good (one small row per post per day).
create table app.moment_daily_views (
  moment_id uuid not null references app.moments (id) on delete cascade,
  day       date not null,
  viewers   integer not null default 0 check (viewers >= 0),
  primary key (moment_id, day)
);
create index moment_daily_views_day_idx on app.moment_daily_views (day);

comment on table app.moment_daily_views is 'Different signed-in members (not the author) who had a post on screen, per Asia/Bangkok day. Kept for good.';

alter table app.moment_daily_views enable row level security;
alter table app.moment_daily_views force row level security;
create policy runtime_all on app.moment_daily_views to app_runtime using (true) with check (true);
grant select, insert, update on app.moment_daily_views to app_runtime;

-- What the last 30 days left behind: each member's latest sighting, on its day
insert into app.moment_daily_views (moment_id, day, viewers)
select s.moment_id, (s.seen_at at time zone 'Asia/Bangkok')::date, count(*)
from app.moment_seen s join app.moments m on m.id = s.moment_id
where m.author_id is distinct from s.member_id
group by 1, 2;
