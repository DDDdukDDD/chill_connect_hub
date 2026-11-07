-- A member says they did not go to an ended event that has no host check-in (an อีเวนต์ or a sample ตี้).
-- Was kept only in the browser (localStorage myhub_missed_event_ids); now it follows the account. lib/members/activity.ts markMissed
alter table app.event_participants add column missed_at timestamptz;
alter table app.event_participants add constraint event_participants_missed_joined check (missed_at is null or status = 'joined');
