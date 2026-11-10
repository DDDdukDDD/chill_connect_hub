-- "ไปกัน" plans (owner 2026-11-10): when a friend answers "ไปกัน" on a post they were invited to, the two get a plan
-- for that place (lib/social/friendPlans.ts). The date is set in their chat; the hourly job reminds them the day before
-- and asks how it went the day after. When both post a moment at the place after the plan was made, each earns the
-- "ไปกับเพื่อน" bonus (proven posts only, like every XP).
create table app.friend_plans (
  id               uuid primary key,
  moment_id        uuid references app.moments (id) on delete set null,
  target_type      text not null check (target_type in ('spot', 'community', 'fair', 'general')),
  target_ref       text,
  title            text not null check (char_length(title) between 1 and 200),
  image            text,
  inviter_id       uuid not null references app.members (id) on delete cascade,
  friend_id        uuid not null references app.members (id) on delete cascade,
  plan_date        date,
  status           text not null default 'planning' check (status in ('planning', 'set', 'cancelled')),
  inviter_went_at  timestamptz,
  friend_went_at   timestamptz,
  reminded_at      timestamptz,
  followed_up_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (inviter_id <> friend_id)
);
-- One plan per post and pair: answering "ไปกัน" twice finds the same plan
create unique index friend_plans_once_idx on app.friend_plans (moment_id, inviter_id, friend_id) where moment_id is not null;
create index friend_plans_inviter_idx on app.friend_plans (inviter_id);
create index friend_plans_friend_idx on app.friend_plans (friend_id);
create index friend_plans_due_idx on app.friend_plans (plan_date) where status = 'set';

alter table app.friend_plans enable row level security;
alter table app.friend_plans force row level security;
create policy runtime_all on app.friend_plans to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.friend_plans to app_runtime;

-- Notices of a plan: the day before ('plan_soon'), the day after ('plan_after'), and when both have been ('plan_together')
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going', 'plan_soon', 'plan_after', 'plan_together'));
