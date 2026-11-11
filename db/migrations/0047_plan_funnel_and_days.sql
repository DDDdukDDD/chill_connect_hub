-- "ชวนไป" made sturdier (owner 2026-11-12): count each step, a polite "not this time", plans that go quiet close, and
-- picking a day together.

-- How many times a shared link was opened (counted once per visit with ?invite=, from the banner)
alter table app.invite_links
  add column opens           integer not null default 0,
  add column first_opened_at timestamptz;

-- "รอบนี้ไม่สะดวก" answers (in the app or through a link), and when a plan with no day closed after going quiet
alter table app.friend_plans
  add column declines       integer not null default 0,
  add column closed_idle_at timestamptz;

-- The days each person in a plan is free; the plan shows the day most of them can make (lib/social/friendPlans.ts)
create table app.friend_plan_days (
  plan_id   uuid not null references app.friend_plans (id) on delete cascade,
  member_id uuid not null references app.members (id) on delete cascade,
  day       date not null,
  primary key (plan_id, member_id, day)
);

comment on table app.friend_plan_days is 'Days a member of a "ไปกัน" plan is free, to pick the day together.';

alter table app.friend_plan_days enable row level security;
alter table app.friend_plan_days force row level security;
create policy runtime_all on app.friend_plan_days to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.friend_plan_days to app_runtime;

-- The host hears "not this time"
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going', 'plan_soon', 'plan_after', 'plan_together', 'invite_no'));
