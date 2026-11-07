-- Challenges done by plan (owner 2026-11-07): one stamp per member, challenge and Thai day (lib/social/questPlan.ts).
-- A photo of the day, when the member shares one, is an ordinary moment; moment_id points to it.
create table app.quest_stamps (
  quest_id   uuid not null references app.quests (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  day        date not null,
  moment_id  uuid references app.moments (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (quest_id, member_id, day)
);
create index quest_stamps_member_idx on app.quest_stamps (member_id);

alter table app.quest_stamps enable row level security;
alter table app.quest_stamps force row level security;
create policy runtime_all on app.quest_stamps to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.quest_stamps to app_runtime;
