-- "ชวนไป" everywhere, as group plans (owner 2026-11-11). 0043 kept one plan per pair; a member now invites up to 15
-- friends to a place, an อีเวนต์, a challenge or a post, and everyone who answers "ไปกัน" joins the same plan and its one
-- group chat (lib/social/friendPlans.ts). The old pair table held only test plans (0043 never reached live with plans
-- in it), so it is replaced rather than converted.
drop table if exists app.friend_plans;

create table app.friend_plans (
  id              uuid primary key,
  host_id         uuid not null references app.members (id) on delete cascade,
  -- What the plan is for: a place, a ตี้ seen in a post, an อีเวนต์, a challenge, or a post with no place page
  target_type     text not null check (target_type in ('spot', 'community', 'fair', 'quest', 'general')),
  target_ref      text,
  -- The post it started from, when it did
  moment_id       uuid references app.moments (id) on delete set null,
  title           text not null check (char_length(title) between 1 and 200),
  image           text,
  plan_date       date,
  status          text not null default 'planning' check (status in ('planning', 'set', 'cancelled')),
  reminded_at     timestamptz,
  followed_up_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index friend_plans_host_idx on app.friend_plans (host_id, target_type, target_ref) where status <> 'cancelled';
create index friend_plans_due_idx on app.friend_plans (plan_date) where status = 'set';

-- Who is in a plan: the host and everyone who said "ไปกัน" are 'going'; friends asked in the app and not answered yet
-- are 'invited'. went_at is set by their first post at the place after the plan was made.
create table app.friend_plan_members (
  plan_id     uuid not null references app.friend_plans (id) on delete cascade,
  member_id   uuid not null references app.members (id) on delete cascade,
  state       text not null check (state in ('invited', 'going')),
  went_at     timestamptz,
  created_at  timestamptz not null default now(),
  primary key (plan_id, member_id)
);
create index friend_plan_members_member_idx on app.friend_plan_members (member_id);

alter table app.friend_plans enable row level security;
alter table app.friend_plans force row level security;
create policy runtime_all on app.friend_plans to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.friend_plans to app_runtime;

alter table app.friend_plan_members enable row level security;
alter table app.friend_plan_members force row level security;
create policy runtime_all on app.friend_plan_members to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.friend_plan_members to app_runtime;
