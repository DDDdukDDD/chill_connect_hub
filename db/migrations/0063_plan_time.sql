-- A friend plan's meeting time (owner 2026-11-18): picking the day when inviting, or in the plan chat, can carry a time.
-- "HH:MM" on plan_date (Bangkok); empty when only the day is agreed. Code reads and writes it only when present.
alter table app.friend_plans add column if not exists plan_time text;
alter table app.friend_plans drop constraint if exists friend_plans_plan_time_check;
alter table app.friend_plans
  add constraint friend_plans_plan_time_check check (plan_time is null or plan_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
