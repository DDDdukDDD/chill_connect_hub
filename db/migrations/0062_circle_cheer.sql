-- Circles fixes (BE-408, owner 2026-11-18): a friend's step or finish can be cheered from its Circle.
-- 'cheer': "X ชื่นชมที่คุณลุยชาเลนจ์นี้", once per person and Circle (quest_id, plus moment_id for a posted step).
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going', 'plan_soon', 'plan_after', 'plan_together', 'invite_no', 'follow_along', 'cheer'));
