-- Feed plan step 1 (docs/FEED_PLAN.md): the "สำหรับคุณ" feed moves posts a member has already seen down.
-- The browser sends what was on screen in batches (POST /api/moments/seen), never one write per post.
-- A row is kept 30 days; lib/moments/pgMomentRepository.ts deletes older rows now and then as batches arrive.
create table app.moment_seen (
  member_id uuid not null references app.members (id) on delete cascade,
  moment_id uuid not null references app.moments (id) on delete cascade,
  seen_at   timestamptz not null default now(),
  primary key (member_id, moment_id)
);
create index moment_seen_at_idx on app.moment_seen (seen_at);

comment on table app.moment_seen is 'Posts a member had on screen for over a second (the For You feed ranks them lower). Kept 30 days.';

alter table app.moment_seen enable row level security;
alter table app.moment_seen force row level security;
create policy runtime_all on app.moment_seen to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.moment_seen to app_runtime;
