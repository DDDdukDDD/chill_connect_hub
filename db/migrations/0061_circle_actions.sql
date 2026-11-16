-- Circles round A (BE-400, owner 2026-11-16): opening a Circle can lead to doing the challenge too.
-- 'follow_along': "X เริ่มทำชาเลนจ์ตามคุณ", told to the friend whose finished challenge someone took up from their Circle.
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going', 'plan_soon', 'plan_after', 'plan_together', 'invite_no', 'follow_along'));

-- 'circle': an action that started from a Circle (source_ref is the Circle's id), credited to the friend in it,
-- so "how many people a Circle brought" can be counted (docs/TRACEABILITY.md).
alter table app.action_log drop constraint action_log_source_type_check;
alter table app.action_log
  add constraint action_log_source_type_check check (source_type in ('moment', 'profile', 'invite', 'share', 'circle'));
